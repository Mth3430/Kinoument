import { getPartyCache } from '../../lib/comparisonsCache'
import { loadFromDisk } from '../../lib/diskCache'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const { slug, index } = req.query

  if (!slug || index === undefined) {
    return res.status(400).json({ error: 'Missing slug or index' })
  }

  const proposalIndex = parseInt(index)

  // Charger depuis le disque d'abord
  let data = await loadFromDisk(`comparisons-${slug}`)
  if (!data || !data.comparisons) {
    // Fallback au cache en mémoire
    data = getPartyCache(slug)
  }

  if (!data || !data.comparisons || !data.comparisons[proposalIndex]) {
    return res.status(404).json({ error: 'Proposition non trouvée' })
  }

  // Retourner la proposition complète avec votes détaillés
  const proposal = data.comparisons[proposalIndex]
  res.status(200).json(proposal)
}
