import { unzipSync } from 'fflate'

const AMENDMENTS_URL = 'https://data.assemblee-nationale.fr/static/openData/repository/16/loi/amendements_div_legis/Amendements.json.zip'

async function debugAmendments() {
  console.log('🔍 Diagnostic: structure des amendements\n')

  try {
    console.log('📥 Téléchargement du ZIP...')
    const response = await fetch(AMENDMENTS_URL, { signal: AbortSignal.timeout(30000) })
    const arrayBuffer = await response.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)

    console.log(`✅ ZIP téléchargé (${(uint8.length / 1024 / 1024).toFixed(2)} MB)\n`)

    const archive = unzipSync(uint8)
    const fileNames = Object.keys(archive).filter((n) => n.toLowerCase().endsWith('.json'))

    console.log(`📁 ${fileNames.length} fichiers JSON trouvés\n`)

    // Analyze first file
    if (fileNames.length > 0) {
      const firstFile = fileNames[0]
      console.log(`📄 Analysant le premier fichier: ${firstFile}\n`)

      const text = new TextDecoder().decode(archive[firstFile])
      const data = JSON.parse(text)

      // Log structure
      console.log('Structure des données:')
      console.log(`- Type: ${Array.isArray(data) ? 'Array' : typeof data}`)

      if (Array.isArray(data)) {
        console.log(`- Longueur: ${data.length} items`)
        if (data.length > 0) {
          console.log(`\n🔹 Premier item:\n${JSON.stringify(data[0], null, 2).substring(0, 500)}...\n`)
        }
      } else {
        console.log(`- Clés: ${Object.keys(data).slice(0, 10).join(', ')}`)

        // Check if there's an amendments array
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) {
            console.log(`\n✅ Trouvé array sous "${key}" (${data[key].length} items)`)
            if (data[key].length > 0) {
              console.log(`\n🔹 Premier item:\n${JSON.stringify(data[key][0], null, 2).substring(0, 500)}...\n`)
            }
            break
          }
        }
      }

      // Search for numeric keys
      const numericKeys = Object.keys(data).filter(k => !isNaN(k))
      if (numericKeys.length > 0) {
        console.log(`\n✅ Trouvé ${numericKeys.length} clés numériques`)
        console.log(`Exemples: ${numericKeys.slice(0, 5).join(', ')}`)
        console.log(`\n🔹 Contenu d'une clé numérique:\n${JSON.stringify(data[numericKeys[0]], null, 2).substring(0, 500)}...\n`)
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  }
}

debugAmendments().catch(console.error).finally(() => process.exit(0))
