import { InlineKeyboard } from 'grammy'

export const walletKeyboard = new InlineKeyboard()
	.text('Add Wallet', 'add_wallet')
	.text('Remove Wallet', 'remove_wallet')
	.row()
	.text('Wallet List', 'wallet_list')

export const walletListKeyboard = new InlineKeyboard()
	.text('Add Wallet', 'add_wallet')
	.text('Remove Wallet', 'remove_wallet')
