import { getAllPartiesStatus, preloadAllParties } from '../../lib/comparisonsCache'

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  // Déclenche le préchargement à la première requête (fire and forget)
  preloadAllParties()
  res.status(200).json(getAllPartiesStatus())
}
