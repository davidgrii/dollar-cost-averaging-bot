import { Bot } from 'grammy'
import dotenv from 'dotenv'
import { setupStartCommand } from './commands/start'
import { setupWalletActions } from './callbacks/wallet.actions'
import { setupConfigActions } from './callbacks/config.actions'
import { setupConfigCommands } from './commands/config'
import { setupWalletCommands } from './commands/wallet'
import { setupStopCommand } from './commands/stop'
import { monitorWallets } from './core/solana/monitor.service'
import {
	sendDcaStartNotification,
	sendDcaStopNotification,
} from './core/dca/notifier.service'
import { loadConfig } from './services/config.service'
import type { IOnTx } from './core/solana/types'
import { startDcaMonitor } from './core/dca/dca.controller'
import { handleDcaActivity } from './core/dca/dca.service'

dotenv.config()

const ADMIN_IDS = process.env.ADMIN_IDS?.split(',') || []
export const isAdmin = (userId: number) =>
	ADMIN_IDS!.includes(userId.toString())

export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

export async function startMonitor() {
	const { isBotActive } = await loadConfig()

	if (isBotActive) {
		await bot.api.sendMessage(
			process.env.ADMIN_IDS!.split(',')[0],
			'🚀 Start of Solana wallet monitoring...',
		)

		await monitorWallets(
			async ({
				wallet,
				postTokenSymbol,
				preTokenSymbol,
				volume,
				liquidity,
				pi,
				v1h,
				v5,
				type,
				time,
				price,
				txid,
				fdv,
				vi,
				dcaDurationMinutes,
			}: IOnTx) => {
				handleDcaActivity({
					wallet,
					postTokenSymbol,
					type,
					volume,
					txid,
					onStart: async session => {
						await sendDcaStartNotification(
							session.wallet,
							postTokenSymbol,
							preTokenSymbol,
							session.totalVolume,
							liquidity,
							pi,
							v5,
							v1h,
							type,
							time,
							price,
							session.volumePerInterval,
							session.intervalSec,
							fdv,
							vi,
							dcaDurationMinutes,
						)
					},
					onFinish: session => {
						console.log('DCA stopped:', session)
						sendDcaStopNotification(session)
					},
				})
			},
		)

		startDcaMonitor()
	}
}

startMonitor()

// Commands
setupStartCommand(bot)
setupStopCommand(bot)

setupWalletCommands(bot)
setupConfigCommands(bot)

//Actions
setupWalletActions(bot)
setupConfigActions(bot)

bot.catch(err => console.error('❌ Bot error:', err))
bot.start()
