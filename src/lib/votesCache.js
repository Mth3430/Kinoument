import { unzipSync } from 'fflate'

const VOTES_URL = 'https://data.assemblee-nationale.fr/static/openData/repository/16/loi/scrutins/Scrutins.json.zip'
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
  let amendmentsFound = 0

  for (const fileName of fileNames) {
    const text = new TextDecoder().decode(archive[fileName])
    const data = JSON.parse(text)
    const items = Array.isArray(data) ? data : Array.isArray(data.scrutins) ? data.scrutins : [data]
    for (const item of items) {
      const scrutin = item.scrutin || item
      const voteDate = scrutin.dateScrutin || ''
      totalParsed++

      // No date filtering - keep all votes

      const groupes = (scrutin.ventilationVotes?.organe?.groupes?.groupe || []).map((g) => ({
        organeRef: g.organeRef,
        // positionMajoritaire is nested inside vote, not directly on the group
        positionMajoritaire: g.vote?.positionMajoritaire || null,
      }))
      const titre = scrutin.titre || scrutin.titreScrutin || ''
      // Match various amendment number formats: "n° 281", "n° 281", "NO 281", "n°281", etc.
      const amendMatch = titre.match(/(?:l'amendement|amendement|l'am(?:end\.?)?)\s+(?:no\.|n°|n\.)\s*(\d+)/i)
      const amendementNumero = amendMatch ? amendMatch[1] : null
      if (amendementNumero) amendmentsFound++

      votes.push({
        numero: scrutin.numero || '',
        titre,
        objet: scrutin.objet?.libelle || '',
        exposeSommaire: scrutin.exposeSommaire || scrutin.exposeSommaireTexte || '',
        sort: scrutin.sort?.libelle || '',
        date: voteDate,
        amendementNumero,
        groupes,
      })
    }
  }

  console.log(`[votesCache] ✓ Chargé ${votes.length} votes`)
  console.log(`[votesCache] ✓ ${amendmentsFound} votes avec amendements détectés`)
  console.log(`[votesCache] Total fichiers JSON: ${fileNames.length}`)
  console.log(`[votesCache] Taille cache: ${Math.round((JSON.stringify(votes).length / 1024 / 1024) * 100) / 100}MB`)
  cache = votes
  cacheTime = Date.now()
  return votes
}
