import path from 'path'
import fs from 'fs/promises'

interface IConfigService {
	piThreshold: number
	timeout: number
	isBotActive: boolean
}

const CONFIG_PATH = path.resolve(__dirname, '../data/config.json')

export async function loadConfig(): Promise<IConfigService> {
	const data = await fs.readFile(CONFIG_PATH, 'utf-8')
	return JSON.parse(data)
}

export async function saveConfig(config: IConfigService) {
	await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2))
}

export async function updateConfig(partial: Partial<IConfigService>) {
	const config = await loadConfig()

	const updated = { ...config, ...partial }
	await saveConfig(updated)

	return true
}
