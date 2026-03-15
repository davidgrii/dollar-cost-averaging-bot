import { Bot, Context } from 'grammy'
import { isAdmin } from '../bot'
import { addWallet, loadWallets, removeWallet } from '../services/wallet.service'
import { walletKeyboard, walletListKeyboard } from '../keyboards/wallet.keyboard'

const walletState: Record<number, { step: 'wallet' } | { step: 'token'; pubKey: string } | { step: 'removing' }> = {}

export function setupWalletActions(bot: Bot) {
	bot.callbackQuery('wallet', async (ctx: Context) => {
		const userId = ctx.from?.id
		if (!userId) return null

		if (isAdmin(userId)) {
			await ctx.reply('💼 Wallet Settings:', {
				reply_markup: walletKeyboard,
			})
		} else {
			await ctx.reply("❌ You don't have rights for this command")
		}
	})

	bot.callbackQuery('add_wallet', async ctx => {
		const userId = ctx.from?.id
		if (!userId || !isAdmin(userId)) return

		walletState[userId] = { step: 'wallet' }
		await ctx.answerCallbackQuery()
		await ctx.reply('⌨️ Enter the wallet address:', {
			reply_markup: { force_reply: true },
		})
	})

	bot.callbackQuery('remove_wallet', async (ctx: Context) => {
		const userId = ctx.from?.id
		if (!userId || !isAdmin(userId)) return

		walletState[userId] = { step: 'removing' }

		await ctx.answerCallbackQuery()
		await ctx.reply('⌨️ Enter the address of the wallet to be deleted:', {
			reply_markup: {
				force_reply: true,
			},
		})
	})

	bot.callbackQuery('wallet_list', async (ctx: Context) => {
		const userId = ctx.from?.id
		if (!userId || !isAdmin(userId)) return

		await ctx.answerCallbackQuery()
		const walletsList = await loadWallets()

		if (Object.keys(walletsList).length === 0) {
			await ctx.reply('📭 The list of tracked wallets is empty')
			return
		}

		const formatted = Object.entries(walletsList)
			.map(
				([wallet, token], index) =>
					`<b>${index + 1}. ${token}</b> — <code>${wallet}</code>`,
			)
			.join('\n')

		await ctx.reply(`<b>💼 Tracked wallets:</b>\n\n${formatted}`, {
			parse_mode: 'HTML',
			reply_markup: walletListKeyboard,
		})
	})

	bot.on('message:text', async ctx => {
		const userId = ctx.from?.id
		const text = ctx.message?.text?.trim()

		if (!userId || !text || !walletState[userId]) return

		try {
			const state = walletState[userId]

			if (state.step === 'wallet') {
				walletState[userId] = { step: 'token', pubKey: text }
				await ctx.reply('⌨️ \n' + 'Enter the name of the token (e.g. SOL):', {
					reply_markup: { force_reply: true },
				})
			} else if (state.step === 'token') {
				const pubKey = state.pubKey
				const token = text

				await addWallet(pubKey, token)
				await ctx.reply(`✅ Wallet ${pubKey} with token ${token} added`)
				delete walletState[userId]
			} else if (state.step === 'removing') {
				await removeWallet(text)
				await ctx.reply(`🗑️ Wallet ${text} was deleted`)
				delete walletState[userId]
			}
		} catch (e) {
			await ctx.reply(`⚠️ Error: ${e}`)
			delete walletState[userId]
		}
	})
}
