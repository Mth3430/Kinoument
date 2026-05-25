import { parse } from 'node-html-parser'
import { compareProposal } from './compareLogic'
import { loadFromDisk, saveToDisk } from './diskCache'
import { getVotes } from './votesCache'

const PARTIES = [
  { name: 'Renaissance', slug: 'renaissance', group: 'PO800538' },
  { name: 'Rassemblement National', slug: 'rassemblement-national', group: 'PO800520' },
  { name: 'La France Insoumise', slug: 'la-france-insoumise', group: 'PO800490' },
  { name: 'Les Républicains', slug: 'les-republicains', group: 'PO800508' },
  { name: 'Socialistes et apparentés', slug: 'parti-socialiste', group: 'PO800496' },
  { name: 'Europe Écologie Les Verts', slug: 'europe-ecologie-les-verts', group: 'PO800526' },
  { name: 'Parti Communiste', slug: 'parti-communiste-francais', group: 'PO800502' },
  { name: 'Reconquête', slug: 'reconquete', group: 'PO800532' },
]

// global persiste entre les re-évaluations de modules par Next.js
if (!global._comparisonsCache) global._comparisonsCache = new Map()
if (!global._updateCache) global._updateCache = new Map()
if (global._preloadStarted === undefined) global._preloadStarted = false

const cache = global._comparisonsCache
const updateCache = global._updateCache

export function getPartyCache(slug) {
  return cache.get(slug) || { status: 'pending', comparisons: [], progress: 0, total: 0 }
}

export function getAllPartiesStatus() {
  return PARTIES.map((party) => {
    const state = cache.get(party.slug) || { status: 'pending', progress: 0, total: 0 }
    return {
      slug: party.slug,
      name: party.name,
      status: state.status,
      progress: state.progress,
      total: state.total,
      error: state.error,
    }
  })
}

async function fetchPageProposals(pageUrl) {
  const res = await fetch(pageUrl, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  const root = parse(html)
  const proposals = []

  const allArticles = Array.from(root.querySelectorAll('article'))
  const allDivs = Array.from(root.querySelectorAll('div'))
  const allContainers = [...allArticles, ...allDivs]

  const propositionContainers = allContainers.filter(el => {
    const classStr = el.getAttribute('class') || ''
    const hasRoundedXl = classStr.includes('rounded-xl')
    const hasBorder = classStr.includes('border')
    const hasBg = classStr.includes('bg-')
    return hasRoundedXl && hasBorder && hasBg
  })

  propositionContainers.forEach((el) => {
    // Extraire le titre depuis le h3
    let categoryTitle = ''
    const h3 = el.querySelector('h3')
    if (h3) {
      categoryTitle = h3.text?.trim() || ''
    }

    // Extraire les thèmes depuis les spans/links avec couleur (une seule fois par article)
    const themes = []
    const allSpans = Array.from(el.querySelectorAll('span, a'))
    allSpans.forEach(span => {
      const style = span.getAttribute('style') || ''
      const classStr = span.getAttribute('class') || ''
      const text = span.text?.trim() || ''

      if (text.length > 2 && text.length < 50 && (style.includes('background-color') || style.includes('background:') || classStr.includes('rounded'))) {
        if (text !== 'RE' && text !== '+' && !text.match(/^\d+$/) && !text.includes('http')) {
          const colorMatch = style.match(/background[^:]*:\s*([^;,}]+)/)?.[1]?.trim()

          if (!themes.some(t => t.name === text)) {
            themes.push({
              name: text,
              color: colorMatch || '#F97316'
            })
          }
        }
      }
    })

    // Extraire CHAQUE proposition du div avec bg-gradient
    const propDivs = Array.from(el.querySelectorAll('div[class*="bg-gradient"]'))
    propDivs.forEach(propDiv => {
      const p = propDiv.querySelector('p')
      if (p) {
        const description = p.text?.trim() || ''
        if (description && description.length > 3) {
          proposals.push({
            title: categoryTitle,
            description,
            themes,
            text: categoryTitle + '\n' + description
          })
        }
      }
    })
  })

  return proposals
}

async function getTotalPages(slug) {
  const baseUrl = `https://tous-les-programmes.fr/partis/${slug}`
  const res = await fetch(baseUrl, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  const paginationMatch = html.match(/<nav[^>]*aria-label="Pagination"[\s\S]*?\/[\s\S]*?<span[^>]*>(\d+)<\/span>/)
  return paginationMatch ? parseInt(paginationMatch[1]) : 1
}

async function fetchProposals(slug) {
  const baseUrl = `https://tous-les-programmes.fr/partis/${slug}`
  const totalPages = await getTotalPages(slug)

  let allProposals = []

  for (let page = 1; page <= totalPages; page++) {
    const pageUrl = page === 1 ? baseUrl : `${baseUrl}?page=${page}`
    try {
      const pageProposals = await fetchPageProposals(pageUrl)
      allProposals = [...allProposals, ...pageProposals]
    } catch (e) {
      console.warn(`[fetch] ${slug}: erreur page ${page}:`, e.message)
    }
  }

  if (allProposals.length === 0) throw new Error(`Aucune proposition trouvée pour ${slug}`)
  return allProposals
}

// Sauvegarde l'état du parti sur le disque
async function persistParty(slug, comparisons, proposals, voteCount) {
  await saveToDisk(`comparisons-${slug}`, {
    status: 'ready',
    comparisons,
    proposals,
    voteCount,
    savedAt: new Date().toISOString(),
  })
}

// Vérifie si de nouvelles propositions ou de nouveaux votes sont disponibles,
// et ne traite que ce qui est nouveau.
async function checkForUpdates(party, diskData) {
  let currentProposals
  try {
    currentProposals = await fetchProposals(party.slug)
  } catch (e) {
    console.warn(`[preload] ${party.name} impossible de récupérer les propositions:`, e.message)
    return
  }

  const cachedProposals = diskData.proposals || []
  const newProposals = currentProposals.filter((p) => !cachedProposals.includes(p))

  let currentVoteCount = diskData.voteCount || 0
  try {
    const votes = await getVotes()
    currentVoteCount = votes.length
  } catch {}

  const newVoteCount = currentVoteCount - (diskData.voteCount || 0)
  const hasNewVotes = newVoteCount > 50

  if (newProposals.length === 0 && !hasNewVotes) {
    return
  }

  const comparisons = [...(cache.get(party.slug)?.comparisons || diskData.comparisons)]

  // Traite les nouvelles propositions en parallèle
  const BATCH_SIZE = 15
  for (let i = 0; i < newProposals.length; i += BATCH_SIZE) {
    const batch = newProposals.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.allSettled(
      batch.map((prop) => compareProposal(prop, party.group))
    )

    batchResults.forEach((result, idx) => {
      const proposal = batch[idx]
      if (result.status === 'fulfilled') {
        comparisons.push({ proposal, ...result.value })
      } else {
        console.warn(`[preload] ${party.name} proposition échouée:`, result.reason?.message)
        comparisons.push({ proposal, status: 'unknown', relatedVotes: [], usedOllama: false })
      }
    })

    const progress = Math.round((i + batch.length) / currentProposals.length * 100)
    console.log(`[preload] ${party.name}: ${progress}%`)
    cache.set(party.slug, { status: 'ready', comparisons: [...comparisons], progress: comparisons.length, total: comparisons.length })

    // Sauvegarde périodique pendant les mises à jour
    await saveToDisk(`comparisons-${party.slug}`, {
      status: 'loading',
      comparisons,
      proposals: currentProposals,
      voteCount: currentVoteCount,
      savedAt: new Date().toISOString(),
    })
  }

  // Si de nouveaux votes sont disponibles, re-analyse les propositions sans résultat en parallèle
  if (hasNewVotes) {
    const unknownIndices = comparisons
      .map((c, i) => (c.status === 'unknown' ? i : -1))
      .filter((i) => i >= 0)
    console.log(`[preload] ${party.name} : re-analyse de ${unknownIndices.length} propositions sans correspondance`)

    for (let i = 0; i < unknownIndices.length; i += 10) {
      const batchIndices = unknownIndices.slice(i, i + 10)
      const batchResults = await Promise.allSettled(
        batchIndices.map((idx) => compareProposal(comparisons[idx].proposal, party.group))
      )

      batchResults.forEach((result, idx) => {
        const comparisonsIdx = batchIndices[idx]
        if (result.status === 'fulfilled') {
          comparisons[comparisonsIdx] = { ...comparisons[comparisonsIdx], ...result.value }
        }
      })

      cache.set(party.slug, { status: 'ready', comparisons: [...comparisons], progress: comparisons.length, total: comparisons.length })
    }
  }

  await persistParty(party.slug, comparisons, currentProposals, currentVoteCount)
  console.log(`[preload] ${party.name} : cache mis à jour et sauvegardé`)
}

// Analyse complète (premier lancement ou cache corrompu)
async function fullPreloadParty(party) {
  cache.set(party.slug, { status: 'loading', comparisons: [], progress: 0, total: 0 })
  try {
    const proposals = await fetchProposals(party.slug)
    cache.set(party.slug, { status: 'loading', comparisons: [], progress: 0, total: proposals.length })

    const comparisons = []
    const BATCH_SIZE = 15

    for (let i = 0; i < proposals.length; i += BATCH_SIZE) {
      const batch = proposals.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map((prop) => compareProposal(prop, party.group))
      )

      batchResults.forEach((result, idx) => {
        const propIdx = i + idx
        const proposal = proposals[propIdx]
        if (result.status === 'fulfilled') {
          comparisons.push({ proposal, ...result.value })
        } else {
          console.warn(`[preload] ${party.name} proposition ${propIdx + 1} échouée:`, result.reason?.message)
          comparisons.push({ proposal, status: 'unknown', relatedVotes: [], relatedVotesCount: 0, usedOllama: false })
        }
      })

      const progress = Math.round((i + batch.length) / proposals.length * 100)
      console.log(`[preload] ${party.name}: ${progress}%`)
      cache.set(party.slug, { status: 'loading', comparisons: [...comparisons], progress: Math.min(i + BATCH_SIZE, proposals.length), total: proposals.length })

      // Sauvegarde périodique sur disque après chaque batch
      await saveToDisk(`comparisons-${party.slug}`, {
        status: 'loading',
        comparisons,
        proposals,
        voteCount: 0,
        savedAt: new Date().toISOString(),
      })
    }

    cache.set(party.slug, { status: 'ready', comparisons, progress: proposals.length, total: proposals.length })

    let voteCount = 0
    try { voteCount = (await getVotes()).length } catch {}
    await persistParty(party.slug, comparisons, proposals, voteCount)
    console.log(`[preload] ${party.name}: 100% ✓`)
  } catch (e) {
    console.warn(`[preload] ${party.name} échoué:`, e.message)
    cache.set(party.slug, { status: 'error', comparisons: [], progress: 0, total: 0, error: e.message })
  }
}

async function preloadParty(party) {
  // Tente de charger depuis le cache disque
  const diskData = await loadFromDisk(`comparisons-${party.slug}`)

  if (diskData?.status === 'ready' && diskData.comparisons?.length > 0) {
    cache.set(party.slug, {
      status: 'ready',
      comparisons: diskData.comparisons,
      progress: diskData.comparisons.length,
      total: diskData.comparisons.length,
    })
    console.log(`[preload] ${party.name} : chargé depuis le cache disque (${diskData.comparisons.length} comparaisons)`)
    // Vérifie les mises à jour en arrière-plan sans bloquer
    checkForUpdates(party, diskData).catch((e) =>
      console.warn(`[preload] ${party.name} vérification mises à jour échouée:`, e.message)
    )
    return
  }

  // Pas de cache disque : analyse complète
  await fullPreloadParty(party)
}

export async function quickLoadFromDisk() {
  await Promise.all(
    PARTIES.map(async (party) => {
      const diskData = await loadFromDisk(`comparisons-${party.slug}`)
      if (diskData?.comparisons?.length > 0) {
        cache.set(party.slug, {
          status: 'ready',
          comparisons: diskData.comparisons,
          progress: diskData.comparisons.length,
          total: diskData.comparisons.length,
        })
        console.log(`[preload] ${party.name} : chargé depuis le cache disque (${diskData.comparisons.length} comparaisons)`)
      }
    })
  )
}

// Charge dans le cache temporaire et swap une fois terminé (pour l'update sans interruption)
export async function preloadAllPartiesIntoUpdate() {
  updateCache.clear()
  console.log('[update] ⏳ Mise à jour du cache temporaire...')

  let failed = 0
  for (const party of PARTIES) {
    try {
      const diskData = await loadFromDisk(`comparisons-${party.slug}`)

      if (diskData?.comparisons?.length > 0) {
        updateCache.set(party.slug, {
          status: 'loading',
          comparisons: [...diskData.comparisons],
          progress: 0,
          total: diskData.comparisons.length,
        })
      } else {
        updateCache.set(party.slug, { status: 'loading', comparisons: [], progress: 0, total: 0 })
      }

      await checkForUpdates(party, diskData)
    } catch (e) {
      failed++
      console.warn(`[update] ${party.name} échoué:`, e.message)
    }
  }

  // Swap: remplacer le cache principal par le cache temporaire
  Object.assign(cache, updateCache)
  updateCache.clear()

  if (failed > 0) {
    console.warn(`[update] ${failed}/${PARTIES.length} partis ont échoué`)
  }
  console.log('[update] ✅ Mise à jour terminée et appliquée')
}

export async function preloadAllParties() {
  if (global._preloadStarted) return
  global._preloadStarted = true
  console.log('[preload] Démarrage...')

  let failed = 0
  for (const party of PARTIES) {
    try {
      await preloadParty(party)
    } catch (e) {
      failed++
      console.warn(`[preload] ${party.name} échoué:`, e.message)
    }
  }

  if (failed > 0) {
    console.warn(`[preload] ${failed}/${PARTIES.length} partis ont échoué`)
  } else {
    console.log('[preload] Toutes les analyses terminées (ou chargées depuis le cache)')
  }
}
