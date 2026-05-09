import { getPartyCache } from '../../lib/comparisonsCache'
import { loadFromDisk } from '../../lib/diskCache'

// Réduit la taille des données pour éviter JSON.stringify overflow
// Retourne sans relatedVotes détaillés pour garder la taille petite
function compressComparisons(comparisons) {
  return comparisons.map(comp => ({
    proposal: {
      title: comp.proposal?.title,
      description: comp.proposal?.description,
      themes: comp.proposal?.themes,
    },
    title: comp.title || comp.proposal?.title,
    description: comp.description || comp.proposal?.description,
    status: comp.status,
    explanation: comp.explanation,
    relatedVotesCount: comp.relatedVotes?.length ?? 0,
    usedOllama: comp.usedOllama,
  }))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { slug } = req.query
  if (!slug) return res.status(400).json({ error: 'Missing slug' })

  // Charger depuis le disque (données en cache, très rapide)
  const diskData = await loadFromDisk(`comparisons-${slug}`)
  if (diskData?.status === 'ready') {
    return res.status(200).json({
      status: diskData.status,
      comparisons: compressComparisons(diskData.comparisons),
      progress: diskData.comparisons?.length ?? 0,
      total: diskData.comparisons?.length ?? 0,
    })
  }

  // Fallback au cache en mémoire si pas de disque
  const cacheData = getPartyCache(slug)
  if (cacheData?.status === 'ready') {
    return res.status(200).json({
      status: cacheData.status,
      comparisons: compressComparisons(cacheData.comparisons),
      progress: cacheData.comparisons?.length ?? 0,
      total: cacheData.comparisons?.length ?? 0,
    })
  }

  // Données pas prêtes
  res.status(200).json(cacheData || { status: 'pending', comparisons: [], progress: 0, total: 0 })
}
