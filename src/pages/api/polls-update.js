import fs from 'fs'
import path from 'path'

// Endpoint pour mettre à jour les sondages
// Usage: POST /api/polls-update avec les données dans le body
// Exemple:
// {
//   "source": "IFOP",
//   "date": "2026-05-14",
//   "polls": { "renaissance": 25, ... }
// }

const POLLS_FILE = path.join(process.cwd(), 'src', 'data', 'polls.json')

function readPolls() {
  try {
    const content = fs.readFileSync(POLLS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('[polls-update] Error reading polls:', error.message)
    throw error
  }
}

function writePolls(data) {
  try {
    fs.writeFileSync(POLLS_FILE, JSON.stringify(data, null, 2))
    // Nettoyer le cache après mise à jour
    const cacheFile = path.join(process.cwd(), '.cache', 'polls-cache.json')
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile)
    }
    return true
  } catch (error) {
    console.error('[polls-update] Error writing polls:', error.message)
    throw error
  }
}

export default async function handler(req, res) {
  // Seulement en développement ou avec une clé secrète
  const isDev = process.env.NODE_ENV === 'development'
  const secretKey = req.headers['x-update-key']
  const validKey = process.env.POLLS_UPDATE_KEY || 'dev-key'

  if (!isDev && secretKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'POST') {
    try {
      const { source, date, polls } = req.body

      if (!source || !date || !polls) {
        return res.status(400).json({ error: 'Missing required fields: source, date, polls' })
      }

      const data = readPolls()

      // Ajouter ou mettre à jour la source de sondage
      data.sources[source] = {
        name: source,
        date,
        url: `https://www.${source.toLowerCase()}.com/`,
        polls
      }

      writePolls(data)

      return res.status(200).json({
        success: true,
        message: `Poll data for ${source} updated successfully`,
        source: data.sources[source]
      })
    } catch (error) {
      console.error('[polls-update] Error:', error.message)
      return res.status(500).json({ error: 'Failed to update polls: ' + error.message })
    }
  }

  if (req.method === 'GET') {
    try {
      const data = readPolls()
      return res.status(200).json({
        sources: Object.keys(data.sources),
        lastUpdate: Object.entries(data.sources).map(([key, value]) => ({
          source: key,
          date: value.date
        }))
      })
    } catch (error) {
      return res.status(500).json({ error: 'Failed to read polls: ' + error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
