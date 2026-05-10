import { unzipSync } from 'fflate'

const AMENDMENTS_URL = 'https://data.assemblee-nationale.fr/static/openData/repository/16/loi/amendements_div_legis/Amendements.json.zip'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const MEMORY_CACHE = new Map() // Cache en mémoire des amendements chargés

let fileIndex = null // Index des noms de fichiers par numéro
let indexTime = 0
let cachedArchive = null // Cache l'archive entière en mémoire après first download
let buildingIndex = null // Promise pour éviter multiple downloads en parallèle

function decodeHtmlEntities(text) {
  if (typeof text !== 'string') return text
  // Decode HTML entities
  const entities = {
    '&quot;': '"', '&apos;': "'", '&amp;': '&', '&lt;': '<', '&gt;': '>',
    '&nbsp;': ' ', '&middot;': '·', '&ndash;': '–', '&mdash;': '—',
    '&lsquo;': "'", '&rsquo;': "'", '&ldquo;': '"', '&rdquo;': '"',
    '&copy;': '©', '&reg;': '®', '&deg;': '°'
  }

  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char)
  }
  // Handle numeric entities like &#x00E8; (è)
  result = result.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16))
  })
  result = result.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10))
  })
  return result
}

function extractText(val) {
  if (!val) return ''
  if (typeof val === 'string') {
    // Remove HTML tags and decode entities
    return decodeHtmlEntities(val.replace(/<[^>]*>/g, '')).trim()
  }
  if (typeof val === 'object') {
    return val['#text'] || val.texte || val.libelle || Object.values(val).find(v => typeof v === 'string') || ''
  }
  return ''
}

// Build index of filenames to amendment numbers and cache the archive
async function buildFileIndex() {
  // Return cached index if still valid
  if (fileIndex && Date.now() - indexTime < CACHE_TTL) return fileIndex

  // If already building, wait for it to finish instead of downloading again
  if (buildingIndex) return await buildingIndex

  // Start building and cache the promise to prevent parallel downloads
  buildingIndex = (async () => {
    try {
      const response = await fetch(AMENDMENTS_URL, { signal: AbortSignal.timeout(600000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const arrayBuffer = await response.arrayBuffer()
      const uint8 = new Uint8Array(arrayBuffer)
      const archive = unzipSync(uint8)

      // Cache the entire archive in memory for subsequent amendment loads
      cachedArchive = archive

      const newIndex = new Map()
      const fileNames = Object.keys(archive).filter((n) => n.toLowerCase().endsWith('.json'))

      // Créer un mapping: numéro → nom de fichier
      for (const fileName of fileNames) {
        // Format: .../AMANR5L16PO59047BTC2071P0D1N000029.json
        // Extraire le numéro à la fin: 000029
        const match = fileName.match(/N(\d+)\.json$/i)
        if (match) {
          const numero = String(parseInt(match[1])) // "000029" → "29"
          newIndex.set(numero, fileName)
        }
      }

      fileIndex = newIndex
      indexTime = Date.now()
      return newIndex
    } catch (err) {
      console.error('[amendmentsCache] Erreur création index:', err.message)
      return new Map()
    } finally {
      // Clear the building promise so future requests can rebuild if needed
      buildingIndex = null
    }
  })()

  return await buildingIndex
}

// Load a single amendment file from the ZIP
async function loadAmendmentFromZip(numeroAmendement) {
  try {
    // Build index first (if not already built)
    const index = await buildFileIndex()
    const fileName = index.get(String(numeroAmendement))

    if (!fileName) {
      console.log(`[amendmentsCache] Amendement ${numeroAmendement} non trouvé dans l'index`)
      return null
    }

    // Use cached archive if available, otherwise download
    let archive = cachedArchive
    if (!archive) {
      const response = await fetch(AMENDMENTS_URL, { signal: AbortSignal.timeout(600000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const arrayBuffer = await response.arrayBuffer()
      const uint8 = new Uint8Array(arrayBuffer)
      archive = unzipSync(uint8)
      cachedArchive = archive
    }

    if (!archive[fileName]) {
      console.log(`[amendmentsCache] Fichier ${fileName} non trouvé dans le ZIP`)
      return null
    }

    const text = new TextDecoder().decode(archive[fileName])
    const data = JSON.parse(text)
    const amdt = data.amendement || data

    // Extract from nested structure: corps.contenuAuteur contains the actual text
    const contenuAuteur = amdt.corps?.contenuAuteur || {}
    const exposeSommaire = extractText(contenuAuteur.exposeSommaire || contenuAuteur.resume)
    const dispositif = extractText(contenuAuteur.dispositif || contenuAuteur.texte)
    const auteur = extractText(amdt.signataires?.libelle || amdt.auteur?.libelle || amdt.auteur)
    const sort = extractText(amdt.cycleDeVie?.sort || amdt.sort?.libelle || amdt.sort)

    const result = {
      numero: numeroAmendement,
      exposeSommaire,
      dispositif,
      auteur,
      sort
    }

    // Cache en mémoire
    MEMORY_CACHE.set(String(numeroAmendement), result)
    return result
  } catch (err) {
    console.warn(`[amendmentsCache] Erreur chargement amendement ${numeroAmendement}:`, err.message)
    return null
  }
}

// Pré-charger l'index et le ZIP en cache (appelé au démarrage)
export async function preloadAmendmentsCache() {
  console.log('[amendmentsCache] Pré-chargement en arrière-plan...')
  try {
    await buildFileIndex()
    console.log('[amendmentsCache] Pré-chargement terminé')
  } catch (err) {
    console.warn('[amendmentsCache] Pré-chargement échoué:', err.message)
  }
}

export async function getAmendmentText(numero) {
  if (!numero) return null

  const key = String(numero).trim()

  // Vérifier cache mémoire d'abord
  if (MEMORY_CACHE.has(key)) {
    return MEMORY_CACHE.get(key)
  }

  // Charger depuis le ZIP
  const result = await loadAmendmentFromZip(key)
  if (!result && MEMORY_CACHE.size === 0) {
    console.log(`[amendmentsCache] Premier appel getAmendmentText pour ${key}: ${result ? 'trouvé' : 'non trouvé'}`)
  }
  return result
}
