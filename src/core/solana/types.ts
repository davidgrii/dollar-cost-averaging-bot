export interface IOnTx {
	wallet: string
	postTokenSymbol: string
	preTokenSymbol: string | undefined
	volume: number
	liquidity: number
	txid: string
	v1h: number
	v5: number
	type: 'BUY' | 'SELL' | 'UNKNOWN'
	time: string
	price: number
	pi: number
	fdv: number
	vi: number
	dcaDurationMinutes?: number
}
