import { Bot, Context } from 'grammy'
import { configKeyboard } from '../keyboards/config.keyboard'
import { isAdmin } from '../bot'

export function setupConfigCommands(bot: Bot) {
	bot.command('config', async (ctx: Context) => {
		const userId = ctx.from?.id
		if (!userId || !isAdmin(userId))
			return await ctx.reply('❌ You dont have access for this command')

		await ctx.reply('⚙️ Choose a config option below:', {
			reply_markup: configKeyboard,
		})
	})
}
