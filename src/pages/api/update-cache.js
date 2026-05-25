import { preloadAllPartiesIntoUpdate, preloadSinglePartyIntoUpdate } from '../../lib/comparisonsCache'

let isUpdating = false

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (isUpdating) {
    return res.status(429).json({ error: 'Update already in progress', message: 'Veuillez attendre la fin de la mise à jour précédente' })
  }

  const { slug } = req.query
  isUpdating = true
  const startTime = Date.now()

  if (slug) {
    console.log(`[update-cache] 🔄 Mise à jour de ${slug}...`)

    preloadSinglePartyIntoUpdate(slug)
      .then(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`[update-cache] ✅ ${slug} mis à jour! (${elapsed}s)`)
        isUpdating = false
      })
      .catch((e) => {
        console.error(`[update-cache] ❌ Erreur ${slug}:`, e.message)
        isUpdating = false
      })

    res.status(202).json({
      status: 'updating',
      party: slug,
      message: `Mise à jour de ${slug} en cours`,
      note: 'Le site continue de fonctionner avec le cache existant'
    })
  } else {
    console.log('[update-cache] 🔄 Mise à jour du cache complet...')

    preloadAllPartiesIntoUpdate()
      .then(() => {
        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
        console.log(`[update-cache] ✅ Mise à jour terminée! (${elapsed} minutes)`)
        isUpdating = false
      })
      .catch((e) => {
        console.error('[update-cache] ❌ Erreur mise à jour:', e.message)
        isUpdating = false
      })

    res.status(202).json({
      status: 'updating',
      message: 'Mise à jour du cache complet en cours',
      note: 'Le site continue de fonctionner avec le cache existant'
    })
  }
}
