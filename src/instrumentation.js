export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getVotes } = await import('./lib/votesCache')
    const { getGroupsMap } = await import('./lib/groupsCache')
    const { quickLoadFromDisk } = await import('./lib/comparisonsCache')
    const { preloadAmendmentsCache } = await import('./lib/amendmentsCache')

    console.log('[preload] ⏳ Chargement complet au démarrage...')
    console.log('[preload] Chargement des votes, groupes...')

    const startTime = Date.now()

    await Promise.all([
      getVotes().then((v) => console.log(`[preload] ✓ ${v.length} votes chargés`)).catch((e) => console.warn('[preload] ✗ votes échoué:', e.message)),
      getGroupsMap().then((g) => console.log(`[preload] ✓ ${g.size} groupes chargés`)).catch((e) => console.warn('[preload] ✗ groupes échoué:', e.message)),
    ])

    // Charge le cache disque en parallèle pour tous les partis (bloque le démarrage du serveur)
    console.log('[preload] 📦 Chargement du cache disque...')
    await quickLoadFromDisk()
    console.log('[preload] ✅ Cache disque chargé')

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[preload] 🚀 Prêt! (${elapsed}s)`)

    // Lance preloadAmendmentsCache EN ARRIÈRE-PLAN (don't wait)
    preloadAmendmentsCache().catch((e) => console.warn('[preload] ✗ amendements échoué:', e.message))
  }
}
