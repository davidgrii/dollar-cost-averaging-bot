import { Bot, Context } from 'grammy'
import { walletKeyboard } from '../keyboards/wallet.keyboard'
import { isAdmin } from '../bot'

export function setupWalletCommands(bot: Bot) {
	bot.command('wallet', async (ctx: Context) => {
		const userId = ctx.from?.id
		if (!userId || !isAdmin(userId))
			return await ctx.reply('❌ You dont have access for this command')

		await ctx.reply('💼 Wallet Settings:', {
			reply_markup: walletKeyboard,
		})
	})
}
