import { getPartyCache, preloadAllParties } from '../../lib/comparisonsCache'
import { loadFromDisk } from '../../lib/diskCache'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { slug } = req.query
  if (!slug) return res.status(400).json({ error: 'Missing slug' })

  await preloadAllParties()

  // Toujours charger depuis le disque pour avoir les données les plus à jour
  const diskData = await loadFromDisk(`comparisons-${slug}`)
  if (diskData?.status === 'ready') {
    return res.status(200).json(diskData)
  }

  // Fallback au cache en mémoire si pas de disque
  res.status(200).json(getPartyCache(slug))
}
