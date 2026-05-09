import { unzipSync } from 'fflate'

async function findGroupsInVotes() {
  const VOTES_URL = 'https://data.assemblee-nationale.fr/static/openData/repository/16/loi/scrutins/Scrutins.json.zip'

  const response = await fetch(VOTES_URL)
  const arrayBuffer = await response.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)

  const archive = unzipSync(uint8)
  const fileNames = Object.keys(archive).filter((name) => name.toLowerCase().endsWith('.json'))

  let firstScrutin = null

  for (const fileName of fileNames) {
    const text = new TextDecoder().decode(archive[fileName])
    const data = JSON.parse(text)
    const items = Array.isArray(data) ? data : Array.isArray(data.scrutins) ? data.scrutins : [data]

    for (const item of items) {
      const scrutin = item.scrutin || item
      const voteDate = scrutin.dateScrutin || ''

      if (voteDate && voteDate.slice(0, 4) >= '2022') {
        firstScrutin = scrutin
        break
      }
    }
    if (firstScrutin) break
  }

  if (firstScrutin) {
    console.log('First scrutin structure:')
    const groupes = firstScrutin.ventilationVotes?.organe?.groupes?.groupe || []
    console.log(`\nFound ${groupes.length} groups in first scrutin:\n`)

    groupes.forEach(g => {
      console.log(`organeRef: ${g.organeRef}`)
      console.log(`nombreMembresGroupe: ${g.nombreMembresGroupe}`)
      console.log(`position: ${g.vote?.positionMajoritaire}`)
      console.log()
    })
  }
}

findGroupsInVotes().catch(console.error)
