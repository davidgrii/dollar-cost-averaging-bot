import { Bot, Context } from 'grammy'
import { mainKeyboard } from '../keyboards/main.keyboard'
import { isAdmin, startMonitor } from '../bot'
import { updateConfig } from '../services/config.service'

export function setupStartCommand(bot: Bot) {
	bot.command('start', async (ctx: Context) => {
		const userId = ctx.from?.id
		if (!userId) return null

		await updateConfig({ isBotActive: true })
		await startMonitor()

		if (isAdmin(userId)) {
			await bot.api.setMyCommands([
				{ command: 'start', description: '- Start the bot' },
				{ command: 'config', description: '- Config Settings' },
				{ command: 'wallet', description: '- Wallet Settings' },
				{ command: 'stop', description: '- Stop the bot' },
			])

			await ctx.reply(
				`Hey, ${isAdmin(userId) ? 'Admin' : 'Viewer'}, welcome to the bot!`,
				{
					reply_markup: mainKeyboard,
				},
			)
		}

		if (!isAdmin(userId)) {
			await bot.api.setMyCommands([
				{ command: 'start', description: '- Start the bot' },
				{ command: 'stop', description: '- Stop the bot' },
			])

			await ctx.reply(
				`Hey, ${isAdmin(userId) ? 'Admin' : 'Viewer'}, welcome to the bot! ${ctx.from?.id}`,
			)
		}
	})
}
