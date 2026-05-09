import { unzipSync } from 'fflate'

async function checkContent() {
  console.log('🔍 Chercher où sont les descriptions d\'amendements\n')

  const response = await fetch('https://data.assemblee-nationale.fr/static/openData/repository/16/loi/amendements_div_legis/Amendements.json.zip', {
    signal: AbortSignal.timeout(600000)
  })
  const arrayBuffer = await response.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  const archive = unzipSync(uint8)

  const fileNames = Object.keys(archive).filter((n) => n.toLowerCase().endsWith('.json'))

  // Tester 20 amendements aléatoires
  console.log('Analyse de 20 amendements aléatoires:\n')

  let withContent = 0
  let withoutContent = 0

  for (let i = 0; i < Math.min(20, fileNames.length); i += Math.floor(fileNames.length / 20)) {
    const fileName = fileNames[i]
    const text = new TextDecoder().decode(archive[fileName])
    const data = JSON.parse(text)
    const amdt = data.amendement || data

    const numero = amdt.identification?.numeroLong

    // Chercher du contenu partout
    let hasContent = false
    let contentField = null
    let contentPreview = null

    // Check direct fields
    if (amdt.disposer && typeof amdt.dispositif === 'string' && amdt.dispositif.length > 10) {
      hasContent = true
      contentField = 'dispositif'
      contentPreview = amdt.dispositif.substring(0, 80)
    }

    // Check corps
    if (!hasContent && amdt.corps) {
      if (amdt.corps.contenuAuteur && typeof amdt.corps.contenuAuteur === 'object') {
        for (const [k, v] of Object.entries(amdt.corps.contenuAuteur)) {
          if (typeof v === 'string' && v.length > 10 && !v.startsWith('@')) {
            hasContent = true
            contentField = `corps.contenuAuteur.${k}`
            contentPreview = v.substring(0, 80)
            break
          }
        }
      }
      if (!hasContent && amdt.corps.cartoucheInformatif && typeof amdt.corps.cartoucheInformatif === 'object') {
        for (const [k, v] of Object.entries(amdt.corps.cartoucheInformatif)) {
          if (typeof v === 'string' && v.length > 10) {
            hasContent = true
            contentField = `corps.cartoucheInformatif.${k}`
            contentPreview = v.substring(0, 80)
            break
          }
        }
      }
    }

    // Check representations
    if (!hasContent && amdt.representations && Array.isArray(amdt.representations.representation)) {
      const rep = amdt.representations.representation[0]
      if (rep && typeof rep === 'object') {
        for (const [k, v] of Object.entries(rep)) {
          if (typeof v === 'string' && v.length > 10 && !v.startsWith('@')) {
            hasContent = true
            contentField = `representations.representation[0].${k}`
            contentPreview = v.substring(0, 80)
            break
          }
        }
      }
    }

    if (hasContent) {
      console.log(`✓ #${numero}: ${contentField}`)
      console.log(`  "${contentPreview}..."\n`)
      withContent++
    } else {
      console.log(`✗ #${numero}: aucun contenu trouvé`)
      console.log(`  Keys: ${Object.keys(amdt).filter(k => !k.startsWith('@')).slice(0, 5).join(', ')}\n`)
      withoutContent++
    }
  }

  console.log(`\n📊 Résultat: ${withContent} avec contenu, ${withoutContent} sans contenu`)
}

checkContent().catch(console.error).finally(() => process.exit(0))
