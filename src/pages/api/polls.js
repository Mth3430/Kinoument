import pollsData from '../../data/polls.json'

async function loadPolls() {
  // Charge les sondages depuis le fichier JSON
  // Le fichier est automatiquement rechargé à chaque requête
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
    const sources = await loadPolls()
    const result = calculateAverage(sources)

    res.status(200).json(result)
  } catch (error) {
    console.error('[polls] Error:', error.message)
    res.status(500).json({ error: 'Failed to load polls: ' + error.message })
  }
}
