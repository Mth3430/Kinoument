import { unzipSync } from 'fflate'

async function analyzeGroupNames() {
  const VOTES_URL = 'https://data.assemblee-nationale.fr/static/openData/repository/16/loi/scrutins/Scrutins.json.zip'

  const response = await fetch(VOTES_URL)
  const arrayBuffer = await response.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)

  const archive = unzipSync(uint8)
  const fileNames = Object.keys(archive).filter((name) => name.toLowerCase().endsWith('.json'))

  const groupInfo = new Map() // organeRef -> { names, count }

  let sampleVote = null

  for (const fileName of fileNames) {
    const text = new TextDecoder().decode(archive[fileName])
    const data = JSON.parse(text)
    const items = Array.isArray(data) ? data : Array.isArray(data.scrutins) ? data.scrutins : [data]

    for (const item of items) {
      const scrutin = item.scrutin || item
      const voteDate = scrutin.dateScrutin || ''

      // Filter to 2022+
      if (voteDate && voteDate.slice(0, 4) < '2022') continue

      const groupes = scrutin.ventilationVotes?.organe?.groupes?.groupe || []
      for (const g of groupes) {
        const ref = g.organeRef
        const nom = g.nom || 'UNKNOWN'

        if (!groupInfo.has(ref)) {
          groupInfo.set(ref, { names: new Set(), count: 0 })
        }
        const entry = groupInfo.get(ref)
        entry.names.add(nom)
        entry.count++

        if (!sampleVote) {
          sampleVote = { scrutin, groupes }
        }
      }
    }
  }

  // Sort by frequency
  const sorted = Array.from(groupInfo.entries())
    .sort((a, b) => b[1].count - a[1].count)

  console.log('\n=== GROUP CODES WITH NAMES ===\n')
  sorted.forEach(([code, data]) => {
    const names = Array.from(data.names).join(' | ')
    console.log(`${code}: ${data.count} votes - "${names}"`)
  })

  console.log('\n=== SAMPLE VOTE STRUCTURE ===')
  if (sampleVote) {
    console.log(JSON.stringify(sampleVote.groupes[0], null, 2))
  }
}

analyzeGroupNames().catch(console.error)
