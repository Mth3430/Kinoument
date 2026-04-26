import { promises as fs } from 'fs'
import path from 'path'

const CACHE_DIR = path.join(process.cwd(), '.cache')

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true })
}

export async function loadFromDisk(key) {
  try {
    const file = path.join(CACHE_DIR, `${key}.json`)
    const text = await fs.readFile(file, 'utf-8')
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function saveToDisk(key, data) {
  try {
    await ensureCacheDir()
    const file = path.join(CACHE_DIR, `${key}.json`)
    await fs.writeFile(file, JSON.stringify(data), 'utf-8')
  } catch (e) {
    console.warn(`[diskCache] Erreur sauvegarde ${key}:`, e.message)
  }
}
