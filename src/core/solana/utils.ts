export function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

export function formatPrice(value: number): string {
	if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B'
	if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + 'M'
	if (value >= 1_000)
		return (value / 1_000).toFixed(value % 1000 === 0 ? 0 : 1) + 'K'
	return value.toString()
}
