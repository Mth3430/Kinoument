export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getVotes } = await import('./lib/votesCache')
    const { getGroupsMap } = await import('./lib/groupsCache')
    const { preloadAllParties } = await import('./lib/comparisonsCache')

    console.log('[preload] Chargement des votes et groupes...')
    await Promise.all([
      getVotes().then((v) => console.log(`[preload] ${v.length} votes chargés`)).catch((e) => console.warn('[preload] votes échoué:', e.message)),
      getGroupsMap().then((g) => console.log(`[preload] ${g.size} groupes chargés`)).catch((e) => console.warn('[preload] groupes échoué:', e.message)),
    ])

    // Lance l'analyse de tous les partis en arrière-plan (ne bloque pas le démarrage)
    preloadAllParties().catch((e) => console.warn('[preload] analyse globale échouée:', e.message))
  }
}
