import { getHeliusDecodedTransactions } from './solana.service'
import { ParsedConfirmedTransaction } from '@solana/web3.js'

import { loadWallets } from '../../services/wallet.service'
import { loadConfig } from '../../services/config.service'
import { sleep } from './utils'
import type { IOnTx } from './types'

const REQUEST_DELAY_MS = 300

export async function monitorWallets(
	onTx: ({
		wallet,
		postTokenSymbol,
		preTokenSymbol,
		volume,
		txid,
	}: IOnTx) => void,
) {
	const { piThreshold, timeout } = await loadConfig()
	const wallets: Record<string, string> = await loadWallets()

	const CHECK_INTERVAL_MS = timeout * 60_000

	const loop = async () => {
		const { isBotActive } = await loadConfig()
		if (!isBotActive) return console.log('Monitoring has been paused')

		for (const wallet of Object.keys(wallets)) {
			try {
				const decodedTxs = await getHeliusDecodedTransactions(wallet, 5)

				for (const tx of decodedTxs) {
					const swap = tx.events?.swap

					let preTokenMint = 'UNKNOWN'
					let postTokenMint = 'UNKNOWN'

					if (swap) {
						preTokenMint = swap.sourceToken || 'UNKNOWN'
						postTokenMint = swap.destinationToken || 'UNKNOWN'
					} else if (tx.events?.tokenBalanceChange?.length) {
						const changes = tx.events.tokenBalanceChange
						if (changes.length >= 2) {
							preTokenMint = changes[0].mint || 'UNKNOWN'
							postTokenMint = changes[changes.length - 1].mint || 'UNKNOWN'
						}
					} else if (tx.meta) {
						preTokenMint = tx.meta.preTokenBalances?.[0]?.mint || 'UNKNOWN'
						postTokenMint = tx.meta.postTokenBalances?.[0]?.mint || 'UNKNOWN'
					}

					const preTokenSymbol =
						preTokenMint !== 'UNKNOWN'
							? await getTokenSymbol(preTokenMint)
							: 'UNKNOWN'
					const postTokenSymbol =
						postTokenMint !== 'UNKNOWN'
							? await getTokenSymbol(postTokenMint)
							: 'UNKNOWN'

					console.log(
						'PreToken:',
						preTokenSymbol,
						'PostToken:',
						postTokenSymbol,
					)

					const analytics = await getTokenAnalytics(wallets[wallet])
					if (!analytics) continue

					const { liquidity, fdv, price, pi, vi, prices, symbol } = analytics

					const v5 = calculateVI(prices.slice(-5))
					const v1h = calculateVI(prices.slice(-60))

					// Определяем тип сделки
					const type = swap
						? swap.nativeInputAmount < swap.nativeOutputAmount
							? 'BUY'
							: 'SELL'
						: 'UNKNOWN'

					const time = tx.blockTime
						? new Date(tx.blockTime * 1000).toLocaleString()
						: 'n/a'

					const volumeRaw = swap?.nativeInputAmount || 0
					const volume = volumeRaw / 10 ** 6

					const volumePerInterval = 100
					const intervalSec = 60

					const { durationMinutes } = getDcaDurationAndEndTime(
						tx.blockTime ?? 0,
						volume,
						volumePerInterval,
						intervalSec,
					)

					if (pi > piThreshold) {
						const txid =
							tx.transaction?.signatures?.[0] || tx.signature || 'unknown'

						onTx({
							wallet,
							postTokenSymbol,
							preTokenSymbol,
							volume,
							liquidity,
							txid,
							v1h,
							v5,
							type,
							time,
							price,
							pi,
							fdv,
							vi,
							dcaDurationMinutes: durationMinutes,
						})
					}
				}
			} catch (err) {
				console.error(`❌ Error during wallet processing ${wallet}:`, err)
			}

			await sleep(REQUEST_DELAY_MS)
		}

		setTimeout(loop, CHECK_INTERVAL_MS)
	}

	await loop()
}

function extractVolume(tx: ParsedConfirmedTransaction): number {
	const pre = tx.meta?.preTokenBalances?.[0]?.uiTokenAmount?.uiAmount || 0
	const post = tx.meta?.postTokenBalances?.[0]?.uiTokenAmount?.uiAmount || 0

	return Math.abs((post ?? 0) - (pre ?? 0))
}

function typeTransaction(tx: ParsedConfirmedTransaction): 'BUY' | 'SELL' {
	const preAmount = tx.meta?.preTokenBalances?.[0]?.uiTokenAmount?.uiAmount || 0
	const postAmount =
		tx.meta?.postTokenBalances?.[0]?.uiTokenAmount?.uiAmount || 0

	return postAmount > preAmount ? 'BUY' : 'SELL'
}

function timeTransaction(tx: ParsedConfirmedTransaction): string {
	const unixTime = tx.blockTime
	return unixTime ? new Date(unixTime * 1000).toLocaleString() : 'n/a'
}

function getDcaDurationAndEndTime(
	dcaStartAtSec: number,
	volume: number,
	volumePerInterval: number,
	intervalSec: number,
) {
	const intervalsCount = Math.ceil(volume / volumePerInterval)
	const totalDurationSec = intervalsCount * intervalSec
	const endTimeSec = dcaStartAtSec + totalDurationSec
	const durationMinutes = Math.round(totalDurationSec / 60)
	const endTimeStr = new Date(endTimeSec * 1000).toLocaleString()

	return { durationMinutes, endTimeStr }
}

//////////////////////////////////////////////////

async function getTokenAnalytics(symbol: string) {
	if (!symbol || symbol === 'UNKNOWN') return null

	const result = {
		symbol,
		price: 0,
		liquidity: 0,
		fdv: 0,
		pi: 0,
		vi: 0,
		prices: [] as number[],
		dex: null as any,
		jupiter: null as any,
	}

	try {
		const res = await fetch(
			`https://api.dexscreener.com/latest/dex/search?q=${symbol}`,
		)

		const json = await res.json()
		const pair = json.pairs?.[0]

		if (pair) {
			result.price = parseFloat(pair.priceUsd)
			result.liquidity = parseFloat(pair.liquidity.usd)
			result.fdv = parseFloat(pair.fdv)
			result.dex = pair
		}
	} catch (e) {
		console.error('Dexscreener error:', e)
	}

	// DEX VI
	try {
		const candlesRes = await fetch(
			`https://api.dexscreener.com/latest/dex/search?q=${symbol}`,
		)
		const json = await candlesRes.json()
		const pricesRaw = json.pairs?.[0]?.priceNativeHistory
		const prices = pricesRaw?.length
			? pricesRaw.map((p: any) => parseFloat(p))
			: []

		if (prices.length) {
			result.prices = prices
			result.vi = calculateVI(prices)
		}
	} catch (e) {
		console.error('Price history error:', e)
	}

	// PI
	const volume = result.dex?.volume?.h1 || 0
	if (volume && result.liquidity) {
		result.pi = calculatePI(volume, result.liquidity)
	}

	return result
}

let tokenListCache: Record<string, string> = {}

async function loadJupiterTokenList() {
	if (Object.keys(tokenListCache).length) return tokenListCache

	const res = await fetch('https://cache.jup.ag/tokens')
	const tokens = await res.json()

	tokenListCache = Object.fromEntries(
		tokens.map((t: any) => [t.address, t.symbol]),
	)
	return tokenListCache
}

async function getTokenSymbol(mint: string): Promise<string> {
	// 1. Jupiter
	const list = await loadJupiterTokenList()
	const fromJupiter = list[mint]
	if (fromJupiter) return fromJupiter

	// 2. Fallback Helius
	try {
		const res = await fetch(
			`https://api.helius.xyz/v0/token-metadata?mint=${mint}&api-key=<YOUR_API_KEY>`,
		)
		const json = await res.json()
		return json?.symbol || 'UNKNOWN'
	} catch (e) {
		console.error('Helius fallback failed:', e)
		return 'UNKNOWN'
	}
}

function calculatePI(volume: number, liquidity: number): number {
	return (volume / liquidity) * 100
}

function calculateVI(prices: number[]): number {
	const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length
	const stdDev = Math.sqrt(
		prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length,
	)
	return (stdDev / avg) * 100
}
