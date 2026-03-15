import { Bot } from 'grammy'
import { updateConfig } from '../services/config.service'

export function setupStopCommand(bot: Bot) {
	bot.command('stop', async () => {
		await updateConfig({ isBotActive: false })

		// await sendDcaStopNotification()
	})
}
