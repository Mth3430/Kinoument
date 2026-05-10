export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getVotes } = await import('./lib/votesCache')
    const { getGroupsMap } = await import('./lib/groupsCache')
    const { preloadAllParties } = await import('./lib/comparisonsCache')
    const { preloadAmendmentsCache } = await import('./lib/amendmentsCache')

    console.log('[preload] ⏳ Chargement complet au démarrage...')
    console.log('[preload] Chargement des votes, groupes et amendements...')

    const startTime = Date.now()

    await Promise.all([
      getVotes().then((v) => console.log(`[preload] ✓ ${v.length} votes chargés`)).catch((e) => console.warn('[preload] ✗ votes échoué:', e.message)),
      getGroupsMap().then((g) => console.log(`[preload] ✓ ${g.size} groupes chargés`)).catch((e) => console.warn('[preload] ✗ groupes échoué:', e.message)),
    ])

    // Lance preloadAmendmentsCache EN ARRIÈRE-PLAN (don't wait)
    preloadAmendmentsCache().catch((e) => console.warn('[preload] ✗ amendements échoué:', e.message))

    // Analyse COMPLÈTE de tous les partis (bloque le démarrage)
    console.log('[preload] 🔄 Analyse de tous les partis en cours...')
    await preloadAllParties()

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
    console.log(`[preload] ✅ PRÊT! Temps total: ${elapsed} minutes`)
  }
}
