#!/usr/bin/env node
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..')

async function main() {
  try {
    const { getVotes } = await import(join(projectRoot, 'src/lib/votesCache.js'), { assert: { type: 'module' } })
    const { getGroupsMap } = await import(join(projectRoot, 'src/lib/groupsCache.js'), { assert: { type: 'module' } })
    const { preloadAllParties } = await import(join(projectRoot, 'src/lib/comparisonsCache.js'), { assert: { type: 'module' } })

    console.log('[cache-update] ⏳ Mise à jour du cache...')
    const startTime = Date.now()

    await Promise.all([
      getVotes().then((v) => console.log(`[cache-update] ✓ ${v.length} votes chargés`)).catch((e) => console.warn('[cache-update] ✗ votes échoué:', e.message)),
      getGroupsMap().then((g) => console.log(`[cache-update] ✓ ${g.size} groupes chargés`)).catch((e) => console.warn('[cache-update] ✗ groupes échoué:', e.message)),
    ])

    console.log('[cache-update] 🔄 Mise à jour des comparaisons...')
    await preloadAllParties()

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
    console.log(`[cache-update] ✅ Mise à jour terminée! (${elapsed} minutes)`)
    process.exit(0)
  } catch (error) {
    console.error('[cache-update] ❌ Erreur:', error.message)
    process.exit(1)
  }
}

main()
