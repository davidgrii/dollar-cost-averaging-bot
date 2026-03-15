import path from 'path'
import fs from 'fs/promises'

const WALLET_PATH = path.resolve(__dirname, '../data/wallets.json')

export async function loadWallets(): Promise<Record<string, string>> {
	const data = await fs.readFile(WALLET_PATH, 'utf-8')
	return JSON.parse(data) as Record<string, string>
}

export async function saveWallets(wallets: Record<string, string>) {
	await fs.writeFile(WALLET_PATH, JSON.stringify(wallets, null, 2))
}

export async function addWallet(pubKey: string, token: string) {
	const wallets = await loadWallets()

	if (wallets[pubKey]) {
		console.log(`The wallet is already being tracked: ${pubKey}`)
	} else {
		wallets[pubKey] = token
		await saveWallets(wallets)
		console.log(`Wallet added: ${pubKey} with token ${token}`)
	}
}

export async function removeWallet(pubKey: string) {
	const wallets = await loadWallets()

	if (!wallets[pubKey]) {
		throw new Error('Wallet not found')
	}

	delete wallets[pubKey]
	await saveWallets(wallets)

	return true
}
