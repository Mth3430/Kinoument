import { getVotes } from './src/lib/votesCache.js'
import { unzipSync } from 'fflate'

async function diagnose() {
  console.log('📊 Diagnostic: vérifier correspondance amendements\n')

  // 1. Récupérer les votes et les numéros d'amendement
  const votes = await getVotes()
  const votesWithAmends = votes.filter(v => v.amendementNumero)

  console.log(`✓ ${votesWithAmends.length} votes avec amendement trouvés`)

  const amendmentNumbersFromVotes = new Set()
  for (const vote of votesWithAmends) {
    amendmentNumbersFromVotes.add(vote.amendementNumero)
  }

  console.log(`✓ ${amendmentNumbersFromVotes.size} numéros uniques d'amendement`)
  console.log(`  Exemples: ${Array.from(amendmentNumbersFromVotes).slice(0, 10).join(', ')}\n`)

  // 2. Télécharger le ZIP et construire l'index
  console.log('📥 Téléchargement du ZIP...')
  const response = await fetch('https://data.assemblee-nationale.fr/static/openData/repository/16/loi/amendements_div_legis/Amendements.json.zip', {
    signal: AbortSignal.timeout(600000)
  })
  const arrayBuffer = await response.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  const archive = unzipSync(uint8)

  const fileNames = Object.keys(archive).filter((n) => n.toLowerCase().endsWith('.json'))
  const indexedAmendments = new Set()

  for (const fileName of fileNames) {
    const match = fileName.match(/N(\d+)\.json$/i)
    if (match) {
      const numero = String(parseInt(match[1]))
      indexedAmendments.add(numero)
    }
  }

  console.log(`✓ ${indexedAmendments.size} amendements dans le ZIP\n`)

  // 3. Comparer les deux ensembles
  console.log('🔍 Analyse de correspondance:\n')

  const foundInZip = Array.from(amendmentNumbersFromVotes).filter(n => indexedAmendments.has(n))
  const notFoundInZip = Array.from(amendmentNumbersFromVotes).filter(n => !indexedAmendments.has(n))

  console.log(`✓ Trouvés dans le ZIP: ${foundInZip.length}/${amendmentNumbersFromVotes.size}`)
  console.log(`✗ NOT trouvés dans le ZIP: ${notFoundInZip.length}/${amendmentNumbersFromVotes.size}`)

  if (notFoundInZip.length > 0) {
    console.log(`\n  Exemples non trouvés: ${notFoundInZip.slice(0, 10).join(', ')}`)
  }

  // 4. Tester un amendement qui existe
  if (foundInZip.length > 0) {
    const testNum = foundInZip[0]
    console.log(`\n📄 Test d'un amendement existant: #${testNum}`)

    const fileName = Array.from(fileNames).find(f => {
      const match = f.match(/N(\d+)\.json$/i)
      return match && String(parseInt(match[1])) === testNum
    })

    if (fileName) {
      const text = new TextDecoder().decode(archive[fileName])
      const data = JSON.parse(text)
      const amdt = data.amendement || data

      console.log(`  Clés disponibles: ${Object.keys(amdt).join(', ')}`)

      if (amdt.corps && amdt.corps.contenuAuteur) {
        console.log(`  ✓ corps.contenuAuteur existe`)
        console.log(`    Keys: ${Object.keys(amdt.corps.contenuAuteur).join(', ')}`)

        const expo = amdt.corps.contenuAuteur.exposeSommaire
        const dispo = amdt.corps.contenuAuteur.dispositif

        console.log(`    exposeSommaire: ${expo ? `${expo.length} chars` : 'vide'}`)
        console.log(`    dispositif: ${dispo ? `${dispo.length} chars` : 'vide'}`)
      } else {
        console.log(`  ✗ corps.contenuAuteur N'EXISTE PAS`)
      }
    }
  }
}

diagnose().catch(console.error).finally(() => process.exit(0))
