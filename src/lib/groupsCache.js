import { unzipSync } from 'fflate'

const ORGANES_URL = 'https://data.assemblee-nationale.fr/static/openData/repository/16/organe/Organes.json.zip'
const CACHE_TTL = 60 * 60 * 1000

// Fallback: known 16th legislature parliamentary groups
const FALLBACK_GROUPS = new Map([
  ['PO800538', 'Renaissance'],
  ['PO800520', 'Rassemblement National'],
  ['PO800490', 'La France Insoumise'],
  ['PO800508', 'Les Républicains'],
  ['PO800496', 'Socialistes et apparentés'],
  ['PO800526', 'Europe Écologie Les Verts'],
  ['PO800502', 'Parti Communiste'],
  ['PO800532', 'Reconquête'],
  ['PO800484', 'Mouvement Démocrate (MODEM)'],
  ['PO800514', 'Libertés et Territoires'],
  ['PO840056', 'Non-inscrits'],
])

let cache = null
let cacheTime = 0

export async function getGroupsMap() {
  if (cache && Date.now() - cacheTime < CACHE_TTL) return cache

  try {
    const response = await fetch(ORGANES_URL, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const arrayBuffer = await response.arrayBuffer()
    const uint8 = new Uint8Array(arrayBuffer)
    const newCache = new Map(FALLBACK_GROUPS) // start with fallback

    const archive = unzipSync(uint8)
    const fileNames = Object.keys(archive).filter((n) => n.toLowerCase().endsWith('.json'))

    for (const fileName of fileNames) {
      const text = new TextDecoder().decode(archive[fileName])
      let data
      try { data = JSON.parse(text) } catch { continue }

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data.organes?.organe)
          ? data.organes.organe
          : data.organe
            ? [data.organe]
            : []

      for (const item of items) {
        const org = item.organe || item
        if (org.uid && org.codeType === 'GP') {
          newCache.set(org.uid, org.libelleAbrege || org.libelle || org.uid)
        }
      }
    }

    cache = newCache
    cacheTime = Date.now()
    return cache
  } catch {
    // ZIP failed — use fallback permanently for this session
    cache = FALLBACK_GROUPS
    cacheTime = Date.now()
    return cache
  }
}
