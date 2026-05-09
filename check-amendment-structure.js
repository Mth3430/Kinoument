import { unzipSync } from 'fflate'

const AMENDMENTS_URL = 'https://data.assemblee-nationale.fr/static/openData/repository/16/loi/amendements_div_legis/Amendements.json.zip'

async function checkStructure() {
  console.log('📥 Downloading amendments ZIP...')
  const response = await fetch(AMENDMENTS_URL, { signal: AbortSignal.timeout(600000) })
  const arrayBuffer = await response.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  const archive = unzipSync(uint8)

  const fileNames = Object.keys(archive).filter((n) => n.toLowerCase().endsWith('.json'))
  console.log(`Found ${fileNames.length} JSON files`)

  // Get first file
  const firstFile = fileNames[0]
  const text = new TextDecoder().decode(archive[firstFile])
  const data = JSON.parse(text)
  const amdt = data.amendement || data

  console.log('\n=== Amendment Structure ===')
  console.log('Top-level keys:', Object.keys(amdt))

  // Find text/description fields
  console.log('\n=== Looking for description fields ===')
  const textFields = ['exposeSommaire', 'expose', 'exposé', 'resume', 'resumeTexte', 'description', 'texte', 'dispositif', 'corps', 'objet', 'titre']
  for (const field of textFields) {
    if (amdt[field]) {
      console.log(`✓ ${field}:`, typeof amdt[field], amdt[field]?.substring?.(0, 100) || (typeof amdt[field] === 'object' ? 'Object' : amdt[field]))
    }
  }

  // Check nested objects
  console.log('\n=== Nested Objects and Their Keys ===')
  for (const [key, value] of Object.entries(amdt)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const subKeys = Object.keys(value)
      console.log(`${key}: {${subKeys.join(', ')}}`)
    } else if (Array.isArray(value)) {
      console.log(`${key}: Array[${value.length}]`)
    }
  }

  // Specifically check corps and signataires
  if (amdt.corps) {
    console.log('\n=== corps structure ===')
    console.log('Keys:', Object.keys(amdt.corps))
    for (const [key, val] of Object.entries(amdt.corps)) {
      if (typeof val === 'string' && val.length > 0) {
        console.log(`${key}: "${val.substring(0, 100)}..."`)
      } else if (typeof val === 'object' && val !== null) {
        console.log(`${key}: ${typeof val} ${Array.isArray(val) ? `[${val.length}]` : '{}'}`)
      }
    }
  }

  if (amdt.signataires) {
    console.log('\n=== signataires structure ===')
    console.log('Type:', typeof amdt.signataires, Array.isArray(amdt.signataires) ? 'Array' : '')
    if (Array.isArray(amdt.signataires) && amdt.signataires.length > 0) {
      console.log('First item keys:', Object.keys(amdt.signataires[0]))
    } else if (typeof amdt.signataires === 'object') {
      console.log('Keys:', Object.keys(amdt.signataires))
      if (amdt.signataires.auteur) {
        console.log('auteur:', JSON.stringify(amdt.signataires.auteur, null, 2).substring(0, 300))
      }
      if (amdt.signataires.libelle) {
        console.log('libelle:', amdt.signataires.libelle)
      }
    }
  }

  // Deep dive into contenuAuteur
  if (amdt.corps && amdt.corps.contenuAuteur) {
    console.log('\n=== contenuAuteur structure ===')
    const contenu = amdt.corps.contenuAuteur
    console.log('Keys:', Object.keys(contenu))
    for (const [key, val] of Object.entries(contenu)) {
      if (typeof val === 'string' && val.length > 0) {
        console.log(`${key}: "${val.substring(0, 120)}..."`)
      } else if (typeof val === 'object' && val !== null) {
        if (Array.isArray(val)) {
          console.log(`${key}: Array[${val.length}]`, val.length > 0 ? `first: ${JSON.stringify(val[0]).substring(0, 100)}` : '')
        } else {
          console.log(`${key}:`, JSON.stringify(val, null, 2).substring(0, 200))
        }
      }
    }
  }

  // Check cycleDeVie for sort/status
  if (amdt.cycleDeVie) {
    console.log('\n=== cycleDeVie structure ===')
    if (amdt.cycleDeVie.sort) {
      console.log('sort:', amdt.cycleDeVie.sort)
    }
    if (amdt.cycleDeVie.dateSort) {
      console.log('dateSort:', amdt.cycleDeVie.dateSort)
    }
  }
}

checkStructure().catch(console.error).finally(() => process.exit(0))
