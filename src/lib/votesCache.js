import { unzipSync } from 'fflate'

const VOTES_URL = 'https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip'
const CACHE_TTL = 10 * 60 * 1000

let cache = null
let cacheTime = 0

export async function getVotes() {
  if (cache && Date.now() - cacheTime < CACHE_TTL) return cache

  const response = await fetch(VOTES_URL)
  if (!response.ok) throw new Error('Failed to fetch votes data')

  const arrayBuffer = await response.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  const votes = []

  const archive = unzipSync(uint8)
  const fileNames = Object.keys(archive).filter((name) => name.toLowerCase().endsWith('.json'))

  let totalParsed = 0
  let totalFiltered = 0

  for (const fileName of fileNames) {
    const text = new TextDecoder().decode(archive[fileName])
    const data = JSON.parse(text)
    const items = Array.isArray(data) ? data : Array.isArray(data.scrutins) ? data.scrutins : [data]
    for (const item of items) {
      const scrutin = item.scrutin || item
      const voteDate = scrutin.dateScrutin || ''
      totalParsed++

      // Filter to keep only votes from 2022-01-01 onwards
      if (totalParsed === 1) console.log(`[votesCache] Sample date format: "${voteDate}" (type: ${typeof voteDate})`)
      if (voteDate && voteDate.slice(0, 4) < '2022') {
        totalFiltered++
        continue
      }

      const groupes = (scrutin.ventilationVotes?.organe?.groupes?.groupe || []).map((g) => ({
        organeRef: g.organeRef,
        // positionMajoritaire is nested inside vote, not directly on the group
        positionMajoritaire: g.vote?.positionMajoritaire || null,
      }))
      const titre = scrutin.titre || scrutin.titreScrutin || ''
      const amendMatch = titre.match(/amendement\s+n°\s*(\w+)/i)
      votes.push({
        numero: scrutin.numero || '',
        titre,
        objet: scrutin.objet?.libelle || '',
        exposeSommaire: scrutin.exposeSommaire || scrutin.exposeSommaireTexte || '',
        sort: scrutin.sort?.libelle || '',
        date: voteDate,
        amendementNumero: amendMatch ? amendMatch[1] : null,
        groupes,
      })
    }
  }

  console.log(`[votesCache] Chargé ${votes.length} votes (${totalParsed} total, ${totalFiltered} filtrés avant 2022)`)
  cache = votes
  cacheTime = Date.now()
  return votes
}
