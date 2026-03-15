import { bot } from '../../bot'
import { InlineKeyboard } from 'grammy'
import { formatPrice } from '../solana/utils'

export async function sendDcaStartNotification(
	wallet: string,
	postTokenSymbol: string | undefined,
	preTokenSymbol: string | undefined,
	volume: number,
	liquidity: number,
	pi: number,
	v1h: number,
	v5: number,
	type: 'BUY' | 'SELL' | 'UNKNOWN',
	time: string,
	price: number,
	volumePerInterval: number,
	intervalSec: number,
	fdv: number,
	vi: number,
	dcaDurationMinutes?: number,
	dcaEndTime?: string,
) {
	const totalSeconds = Math.floor(volume / volumePerInterval) * intervalSec

	const dexLink = postTokenSymbol
		? `https://dexscreener.com/search?q=${postTokenSymbol}`
		: `https://solscan.io/account/${wallet}`

	const jupLink = postTokenSymbol
		? `https://jup.ag/swap/SOL-${postTokenSymbol}`
		: `https://solscan.io/account/${wallet}`

	const msg = `${type === 'BUY' ? '🟢' : '🔴'} <b>DCA Started [${type}]</b>

<b>Token:</b> <code>${postTokenSymbol || 'NaN'}</code> | <code>$${preTokenSymbol} → $${postTokenSymbol}</code>
<b>Amount:</b> <code>${formatPrice(volume)}$</code>
<b>Interval:</b> <code>${volumePerInterval.toFixed(2)}$ / ${intervalSec} sec</code>
<b>DCA Duration:</b> <code>${dcaDurationMinutes} min</code>		
<b>FDV:</b> <code>$${formatPrice(fdv)}</code> | <b>Liq:</b> <code>$${formatPrice(liquidity)}</code>
<b>Price:</b> <code>${formatPrice(price)}$</code>

📊 <b>PI:</b> <code>${pi.toFixed(2)}%</code>

<b>VI:</b> <code>${vi.toFixed(2)}%</code>
<b>V-5m:</b> <code>${v5.toFixed(2)}%</code> | <b>V-1h:</b> <code>${v1h.toFixed(2)}%</code>
				
🕒 <b>Time:</b> <code>${time}</code>
💼 <b>Wallet:</b> <code>${wallet}</code>

🔗 <a href="${dexLink}">DEX</a> | <a href="${jupLink}">JUP</a>
`

	await bot.api.sendMessage(process.env.ADMIN_IDS!.split(',')[0], msg, {
		parse_mode: 'HTML',
		reply_markup: new InlineKeyboard().url(
			'MEXC',
			`https://www.mexc.com/exchange/${postTokenSymbol}_USDT`,
		),
		disable_web_page_preview: true,
	} as {
		parse_mode: 'HTML'
		disable_web_page_preview: boolean
	})
}

export async function sendDcaStopNotification(session: any) {
	const tokenLink = session.tokenSymbol
		? `https://www.mexc.com/exchange/${session.tokenSymbol}_USDT`
		: `https://solscan.io/account/${session.wallet}`

	const msg = `🔴 <b>DCA Stopped [${session.type}]</b>

<b>Token:</b> <code>${session.tokenSymbol}</code>
<b>Tx Count:</b> <code>${session.txCount}</code>
<b>Total Volume:</b> <code>${session.totalVolume.toFixed(2)}$</code>

🕒 <b>Started At:</b> <code>${new Date(session.startedAt).toLocaleString()}</code>
🕒 <b>Last Tx At:</b> <code>${new Date(session.lastTxAt).toLocaleString()}</code>

💼 <b>Wallet:</b> <code>${session.wallet}</code>

🔗 <a href="${tokenLink}">MEXC Exchange</a>`

	await bot.api.sendMessage(process.env.ADMIN_IDS!.split(',')[0], msg, {
		parse_mode: 'HTML',
		reply_to_message_id: session.startMessageId,
		disable_web_page_preview: true,
	} as {
		parse_mode: 'HTML'
		disable_web_page_preview: boolean
	})
}
