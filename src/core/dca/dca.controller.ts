import { checkDcaTimeouts } from './dca.service'
import { sendDcaStopNotification } from './notifier.service'

export function startDcaMonitor() {
	setInterval(() => {
		checkDcaTimeouts(async session => {
			await sendDcaStopNotification(session)
			console.log(
				`DCA session finished: ${session.wallet} - ${session.tokenSymbol}`,
			)
		})
	}, 15_000)
}
