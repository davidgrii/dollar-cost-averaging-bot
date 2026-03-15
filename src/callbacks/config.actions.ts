import { Bot, Context } from 'grammy'
import { configKeyboard } from '../keyboards/config.keyboard'
import { isAdmin } from '../bot'
import { loadConfig, updateConfig } from '../services/config.service'

const configState: Record<number, 'timeout' | 'pithreshold' | undefined> = {}

export function setupConfigActions(bot: Bot) {
	bot.callbackQuery('config', async (ctx: Context) => {
		const userId = ctx.from?.id
		if (!userId || !isAdmin(userId)) return

		await ctx.reply('⚙️ Choose a config option below:', {
			reply_markup: configKeyboard,
		})
	})

	bot.callbackQuery('set_timeout', async (ctx: Context) => {
		const userId = ctx.from?.id
		if (!userId || !isAdmin(userId)) return

		configState[userId] = 'timeout'

		await ctx.answerCallbackQuery()
		await ctx.reply('⌨️ Enter timeout:', {
			reply_markup: {
				force_reply: true,
			},
		})
	})

	bot.callbackQuery('set_pithreshold', async (ctx: Context) => {
		const userId = ctx.from?.id
		if (!userId || !isAdmin(userId)) return

		configState[userId] = 'pithreshold'

		await ctx.answerCallbackQuery()
		await ctx.reply('⌨️ Enter PI Threshold:', {
			reply_markup: {
				force_reply: true,
			},
		})
	})

	bot.on('message:text', async ctx => {
		const userId = ctx.from?.id
		const config = await loadConfig()

		if (!userId) return

		if (configState[userId] === 'timeout') {
			const timeout = parseInt(ctx.message?.text)

			if (isNaN(timeout) || timeout <= 0) {
				await ctx.reply('⚠️ Please enter a valid number greater than 0')
				return
			}

			config.timeout = timeout

			await updateConfig(config)
			await ctx.reply(`✅ Timeout set to ${timeout} minutes`)
		} else if (configState[userId] === 'pithreshold') {
			const pithreshold = Number(ctx.message?.text.replace(',', '.'))

			if (isNaN(pithreshold) || pithreshold <= 0) {
				await ctx.reply('⚠️ Please enter a valid number greater than 0')
				return
			}

			config.piThreshold = pithreshold
			await updateConfig(config)
			await ctx.reply(`✅ PI Threshold set to ${pithreshold}%`)
		}
	})
}
