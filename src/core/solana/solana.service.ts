import {
	Connection,
	ParsedConfirmedTransaction,
	PublicKey,
} from '@solana/web3.js'
import dotenv from 'dotenv'

dotenv.config()

const RPC_URL = process.env.HELIUS_RPC_URL

export const connection = new Connection(RPC_URL!, 'confirmed')

export async function getRecentTransactions(
	address: string,
	limit = 1,
): Promise<ParsedConfirmedTransaction[]> {
	try {
		const pubKey = new PublicKey(address)
		const signatures = await connection.getSignaturesForAddress(pubKey, {
			limit,
		})

		const txs = await Promise.all(
			signatures.map(sig =>
				connection.getParsedTransaction(sig.signature, {
					maxSupportedTransactionVersion: 0,
				}),
			),
		)

		return txs.filter((tx): tx is ParsedConfirmedTransaction => tx !== null)
	} catch (error) {
		console.error(`Ошибка при получении транзакций: ${address}`, error)
		return []
	}
}

export async function getHeliusDecodedTransactions(address: string, limit = 5) {
	const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?limit=${limit}&api-key=`
	const res = await fetch(url)
	if (!res.ok) {
		console.error('Helius API error', await res.text())
		return []
	}
	const json = await res.json()
	return json
}
