#!/usr/bin/env node
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

const slug = process.argv[2]

if (!slug) {
  console.error('[update-party] ❌ Usage: npm run update-party renaissance')
  process.exit(1)
}

async function updateParty() {
  try {
    const response = await fetch(`http://localhost:3000/api/update-cache?slug=${slug}`, {
      method: 'POST',
    })

    const data = await response.json()

    if (response.ok || response.status === 202) {
      console.log(`[update-party] ✅ ${data.message}`)
      console.log(`[update-party] 💡 Vérifies les logs du serveur pour suivre la progression`)
    } else {
      console.error(`[update-party] ❌ Erreur: ${data.error || data.message}`)
      process.exit(1)
    }
  } catch (error) {
    console.error(`[update-party] ❌ Erreur de connexion: ${error.message}`)
    console.error('[update-party] 💡 Assure-toi que le serveur est lancé (npm run dev)')
    process.exit(1)
  }
}

updateParty()
