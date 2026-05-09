import { unzipSync } from 'fflate'

async function checkMapping() {
  console.log('🔍 Vérifier la correspondance: numéro fichier vs numeroLong\n')

  const response = await fetch('https://data.assemblee-nationale.fr/static/openData/repository/16/loi/amendements_div_legis/Amendements.json.zip', {
    signal: AbortSignal.timeout(600000)
  })
  const arrayBuffer = await response.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  const archive = unzipSync(uint8)

  const fileNames = Object.keys(archive).filter((n) => n.toLowerCase().endsWith('.json'))

  console.log(`📁 Analysant 10 fichiers pour voir la correspondance:\n`)

  for (let i = 0; i < 10; i++) {
    const fileName = fileNames[i]
    const text = new TextDecoder().decode(archive[fileName])
    const data = JSON.parse(text)
    const amdt = data.amendement || data

    // Extract from filename: N000113.json -> 113
    const match = fileName.match(/N(\d+)\.json$/i)
    const fileNum = match ? String(parseInt(match[1])) : 'N/A'

    // Extract from JSON
    const jsonNum = amdt.identification?.numeroLong || amdt.identification?.numeroOrdreDepot || '?'

    console.log(`📄 ${fileName.split('/').pop()}`)
    console.log(`  Fichier: N${match?.[1]} → ${fileNum}`)
    console.log(`  JSON numeroLong: ${jsonNum}`)
    console.log(`  JSON numeroOrdreDepot: ${amdt.identification?.numeroOrdreDepot}`)

    // Check if they match
    if (fileNum === jsonNum) {
      console.log(`  ✓ CORRESPONDANCE`)
    } else {
      console.log(`  ✗ PAS DE CORRESPONDANCE`)
    }
    console.log()
  }
}

checkMapping().catch(console.error).finally(() => process.exit(0))
