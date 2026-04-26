import { unzipSync } from 'fflate'

const VOTES_URL = 'https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip'

export default async function handler(req, res) {
  const response = await fetch(VOTES_URL)
  if (!response.ok) return res.status(502).json({ error: 'Failed to fetch votes data' })

  const arrayBuffer = await response.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)

  try {
    const archive = unzipSync(uint8)
    const fileNames = Object.keys(archive).filter((name) => name.toLowerCase().endsWith('.json'))
    if (fileNames.length === 0) return res.status(500).json({ error: 'No JSON file found in archive' })

    const allVotes = []
    for (const fileName of fileNames) {
      const text = new TextDecoder().decode(archive[fileName])
      const data = JSON.parse(text)
      const scrutin = data.scrutin || data
      allVotes.push(scrutin)
    }

    // Show full raw structure of the last scrutin so we can see all available fields
    const last = allVotes[allVotes.length - 1]

    res.status(200).json({
      total: allVotes.length,
      fileCount: fileNames.length,
      rawLastScrutin: last,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
