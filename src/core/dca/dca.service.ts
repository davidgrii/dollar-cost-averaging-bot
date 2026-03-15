type DcaType = 'BUY' | 'SELL' | 'UNKNOWN'

interface DcaSession {
	wallet: string
	tokenSymbol: string
	type: DcaType
	startedAt: number
	lastTxAt: number
	totalVolume: number
	txCount: number
	txids: string[]
	periodMs: number
	intervalMs: number
	plannedMinutes?: number
}

const DCA_TIMEOUT_MS = 3 * 60 * 1000
const DEFAULT_INTERVAL_MS = 60 * 1000
const DEFAULT_PERIOD_MS = 120 * 60 * 1000

const dcaSessions = new Map<string, DcaSession>()

export function handleDcaActivity({
	wallet,
	postTokenSymbol,
	type,
	volume,
	txid,
	periodMs = DEFAULT_PERIOD_MS,
	intervalMs = DEFAULT_INTERVAL_MS,
	onStart,
}: {
	wallet: string
	postTokenSymbol: string
	type: DcaType
	volume: number
	txid: string
	periodMs?: number
	intervalMs?: number
	onStart: (
		session: DcaSession & { volumePerInterval: number; intervalSec: number },
	) => void
	onFinish: (session: DcaSession) => void
}) {
	const key = `${wallet}-${postTokenSymbol}`
	const now = Date.now()

	const session = dcaSessions.get(key)

	if (!session) {
		const newSession: DcaSession = {
			wallet,
			tokenSymbol: postTokenSymbol,
			type,
			startedAt: now,
			lastTxAt: now,
			totalVolume: volume,
			txCount: 1,
			txids: [txid],
			periodMs,
			intervalMs,
		}

		dcaSessions.set(key, newSession)

		const purchasesCount = Math.floor(periodMs / intervalMs) || 1
		const volumePerInterval = volume / purchasesCount
		const intervalSec = intervalMs / 1000

		onStart({ ...newSession, volumePerInterval, intervalSec })
	} else {
		session.lastTxAt = now
		session.totalVolume += volume
		session.txCount += 1
		session.txids.push(txid)
	}
}

export function checkDcaTimeouts(onFinish: (session: DcaSession) => void) {
	const now = Date.now()
	for (const [key, session] of dcaSessions.entries()) {
		if (now - session.lastTxAt > DCA_TIMEOUT_MS) {
			onFinish(session)
			dcaSessions.delete(key)
		}
	}
}
