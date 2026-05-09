import { unzipSync } from 'fflate'

async function analyzeGroupCodes() {
  const VOTES_URL = 'https://data.assemblee-nationale.fr/static/openData/repository/16/loi/scrutins/Scrutins.json.zip'

  const response = await fetch(VOTES_URL)
  const arrayBuffer = await response.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)

  const archive = unzipSync(uint8)
  const fileNames = Object.keys(archive).filter((name) => name.toLowerCase().endsWith('.json'))

  const groupCodes = new Map() // organeRef -> { count, sampleVotes }

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
        if (!groupCodes.has(ref)) {
          groupCodes.set(ref, { count: 0, sampleVotes: [] })
        }
        const entry = groupCodes.get(ref)
        entry.count++

        // Store sample vote info
        if (entry.sampleVotes.length < 3) {
          entry.sampleVotes.push({
            titre: scrutin.titre || '',
            numero: scrutin.numero
          })
        }
      }
    }
  }

  // Sort by frequency
  const sorted = Array.from(groupCodes.entries())
    .sort((a, b) => b[1].count - a[1].count)

  console.log('\n=== GROUP CODES ANALYSIS ===\n')
  sorted.forEach(([code, data]) => {
    console.log(`${code}: ${data.count} votes`)
    console.log('  Sample votes:')
    data.sampleVotes.forEach(v => {
      console.log(`    - ${v.titre.substring(0, 80)}`)
    })
    console.log()
  })

  console.log(`\nTotal unique group codes: ${groupCodes.size}`)
}

analyzeGroupCodes().catch(console.error)
