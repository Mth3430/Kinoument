import { unzipSync } from 'fflate'

async function find113() {
  const response = await fetch('https://data.assemblee-nationale.fr/static/openData/repository/16/loi/amendements_div_legis/Amendements.json.zip', {
    signal: AbortSignal.timeout(600000)
  })
  const uint8 = new Uint8Array(await response.arrayBuffer())
  const archive = unzipSync(uint8)

  const fileNames = Object.keys(archive).filter(n => n.toLowerCase().endsWith('.json'))

  // Find files with 000113
  const matches = fileNames.filter(f => f.includes('000113') || f.includes('N113'))

  console.log(`Cherchant amendement 113...`)
  console.log(`Files trouvés: ${matches.length}`)
  console.log(matches.forEach(f => console.log(`  - ${f}`)))

  if (matches.length > 0) {
    const fileName = matches[0]
    console.log(`\nLisant ${fileName}...`)
    const buffer = archive[fileName]
    console.log(`Taille du fichier: ${buffer.length} bytes`)

    const text = new TextDecoder().decode(buffer)
    console.log(`Contenu (premiers 500 chars):`)
    console.log(text.substring(0, 500))
  }
}

find113().catch(console.error).finally(() => process.exit(0))
