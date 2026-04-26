import { unzipSync } from 'fflate'

const AMENDMENTS_URL = 'https://data.assemblee-nationale.fr/static/openData/repository/17/loi/amendements_div_legis/Amendements.json.zip'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour (large file, cache longer)

// index: numero -> { exposeSommaire, dispositif, auteur, sort }
let index = null
let cacheTime = 0

function extractText(val) {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    return val['#text'] || val.texte || val.libelle || Object.values(val).find(v => typeof v === 'string') || ''
  }
  return ''
}

export async function getAmendmentText(numero) {
  if (!numero) return null
  await ensureIndex()
  return index.get(String(numero).trim()) || null
}

async function ensureIndex() {
  if (index && Date.now() - cacheTime < CACHE_TTL) return

  const response = await fetch(AMENDMENTS_URL)
  if (!response.ok) throw new Error('Failed to fetch amendments data')

  const arrayBuffer = await response.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  const newIndex = new Map()

  const archive = unzipSync(uint8)
  const fileNames = Object.keys(archive).filter((n) => n.toLowerCase().endsWith('.json'))

  for (const fileName of fileNames) {
    const text = new TextDecoder().decode(archive[fileName])
    let data
    try { data = JSON.parse(text) } catch { continue }

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.amendements?.amendement)
        ? data.amendements.amendement
        : data.amendement
          ? [data.amendement]
          : [data]

    for (const item of items) {
      const amdt = item.amendement || item
      const numero = extractText(amdt.numero || amdt.numAmdt)
      if (!numero) continue

      const exposeSommaire = extractText(amdt.exposeSommaire || amdt.exposé || amdt.expose)
      const dispositif = extractText(amdt.dispositif || amdt.corps?.dispositif)
      const auteur = extractText(amdt.signataires?.libelle || amdt.auteur?.libelle || amdt.auteur)
      const sort = extractText(amdt.sort?.libelle || amdt.sort)

      // Keep the first match (files are split by text, so numero may repeat across texts)
      if (!newIndex.has(numero)) {
        newIndex.set(numero, { exposeSommaire, dispositif, auteur, sort })
      }
    }
  }

  index = newIndex
  cacheTime = Date.now()
}
