import pollsData from '../../data/polls.json'
import fs from 'fs'
import path from 'path'

const CACHE_FILE = path.join(process.cwd(), '.cache', 'polls-cache.json')
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
      if (cached.timestamp && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
      }
    }
  } catch (error) {
    console.log('[polls] Cache read error:', error.message)
  }
  return null
}

function saveCache(data) {
  try {
    const dir = path.dirname(CACHE_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ data, timestamp: Date.now() }))
  } catch (error) {
    console.log('[polls] Cache write error:', error.message)
  }
}

async function fetchLatestPolls() {
  try {
    // Essayer de récupérer depuis une source alternative (Wikipedia français pour les sondages)
    // Pour maintenant, on utilise le fichier JSON comme source
    return null
  } catch (error) {
    console.log('[polls] Fetch error:', error.message)
    return null
  }
}

function loadPolls() {
  // Utiliser le fichier JSON comme source de données
  if (!pollsData || !pollsData.sources) {
    throw new Error('Fichier polls.json invalide')
  }
  return pollsData.sources
}

function calculateAverage(sources) {
  const parties = [
    'renaissance',
    'les-republicains',
    'la-france-insoumise',
    'rassemblement-national',
    'parti-socialiste',
    'europe-ecologie-les-verts',
    'parti-communiste-francais',
    'reconquete',
    'place-publique'
  ]

  const partyNames = {
    'renaissance': 'Renaissance',
    'les-republicains': 'Les Républicains',
    'la-france-insoumise': 'La France Insoumise',
    'rassemblement-national': 'Rassemblement National',
    'parti-socialiste': 'Parti Socialiste',
    'europe-ecologie-les-verts': 'EELV',
    'parti-communiste-francais': 'Parti Communiste',
    'reconquete': 'Reconquête',
    'place-publique': 'Place Publique'
  }

  const partyColors = {
    'renaissance': '#DBA404',
    'les-republicains': '#284baa',
    'la-france-insoumise': '#DC2626',
    'rassemblement-national': '#7C3AED',
    'parti-socialiste': '#f94aa1',
    'europe-ecologie-les-verts': '#10B981',
    'parti-communiste-francais': '#991B1B',
    'reconquete': '#2d2e40',
    'place-publique': '#ff9fc4'
  }

  // Calculer les moyennes
  const averages = {}
  const sourceCount = Object.keys(sources).length

  parties.forEach(party => {
    let total = 0
    Object.values(sources).forEach(source => {
      total += source.polls[party] || 0
    })
    averages[party] = Math.round((total / sourceCount) * 10) / 10
  })

  // Formater pour le pie chart
  const data = parties
    .map(slug => ({
      name: partyNames[slug],
      value: averages[slug],
      fill: partyColors[slug],
      slug
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)

  return {
    data,
    sources: Object.values(sources).map(s => ({
      name: s.name,
      date: s.date
    })),
    timestamp: new Date().toISOString()
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vérifier le cache d'abord
    const cached = getCache()
    if (cached) {
      console.log('[polls] Serving from cache')
      return res.status(200).json(cached)
    }

    // Essayer de récupérer les données fraîches
    const latestPolls = await fetchLatestPolls()

    // Utiliser les nouvelles données ou fallback sur le fichier JSON
    const sources = latestPolls || loadPolls()
    const result = calculateAverage(sources)

    // Sauvegarder en cache
    saveCache(result)

    res.status(200).json(result)
  } catch (error) {
    console.error('[polls] Error:', error.message)
    res.status(500).json({ error: 'Failed to load polls: ' + error.message })
  }
}
