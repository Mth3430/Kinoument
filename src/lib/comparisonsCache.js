import { parse } from 'node-html-parser'
import { compareProposal } from './compareLogic'
import { loadFromDisk, saveToDisk } from './diskCache'
import { getVotes } from './votesCache'

const PARTIES = [
  { name: 'Renaissance', slug: 'renaissance', group: 'PO845407' },
  { name: 'Les Républicains', slug: 'les-republicains', group: 'PO845425' },
  { name: 'La France Insoumise', slug: 'la-france-insoumise', group: 'PO845413' },
  { name: 'Rassemblement National', slug: 'rassemblement-national', group: 'PO845401' },
  { name: 'Parti Socialiste', slug: 'parti-socialiste', group: 'PO845419' },
  { name: 'Europe Écologie Les Verts', slug: 'europe-ecologie-les-verts', group: 'PO845439' },
  { name: 'Parti Communiste Français', slug: 'parti-communiste-francais', group: 'PO845514' },
  { name: 'Reconquête', slug: 'reconquete', group: 'PO847173' },
  { name: 'Place Publique', slug: 'place-publique', group: 'PO845454' },
]

// global persiste entre les re-évaluations de modules par Next.js
if (!global._comparisonsCache) global._comparisonsCache = new Map()
if (global._preloadStarted === undefined) global._preloadStarted = false

const cache = global._comparisonsCache

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
  console.log(`[fetch] ${slug}: ${totalPages} pages détectées`)

  let allProposals = []

  for (let page = 1; page <= totalPages; page++) {
    const pageUrl = page === 1 ? baseUrl : `${baseUrl}?page=${page}`
    try {
      const pageProposals = await fetchPageProposals(pageUrl)
      allProposals = [...allProposals, ...pageProposals]
      console.log(`[fetch] ${slug}: page ${page}/${totalPages} - ${pageProposals.length} propositions`)
    } catch (e) {
      console.warn(`[fetch] ${slug}: erreur page ${page}:`, e.message)
    }
  }

  console.log(`[fetch] ${slug}: total ${allProposals.length} propositions`)
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
  console.log(`[preload] ${party.name} : vérification des mises à jour...`)

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
    console.log(`[preload] ${party.name} : aucune mise à jour nécessaire`)
    return
  }

  console.log(`[preload] ${party.name} : ${newProposals.length} nouvelles propositions, ${newVoteCount} nouveaux votes`)

  const comparisons = [...(cache.get(party.slug)?.comparisons || diskData.comparisons)]

  // Traite les nouvelles propositions
  for (const proposal of newProposals) {
    try {
      const result = await compareProposal(proposal, party.group)
      comparisons.push({ proposal, ...result })
    } catch (e) {
      console.warn(`[preload] ${party.name} nouvelle proposition échouée:`, e.message)
      comparisons.push({ proposal, status: 'unknown', relatedVotes: [], usedOllama: false })
    }
    cache.set(party.slug, { status: 'ready', comparisons: [...comparisons], progress: comparisons.length, total: comparisons.length })
  }

  // Si de nouveaux votes sont disponibles, re-analyse les propositions sans résultat
  if (hasNewVotes) {
    const unknownIndices = comparisons
      .map((c, i) => (c.status === 'unknown' ? i : -1))
      .filter((i) => i >= 0)
    console.log(`[preload] ${party.name} : re-analyse de ${unknownIndices.length} propositions sans correspondance`)
    for (const idx of unknownIndices) {
      try {
        const result = await compareProposal(comparisons[idx].proposal, party.group)
        comparisons[idx] = { ...comparisons[idx], ...result }
        cache.set(party.slug, { status: 'ready', comparisons: [...comparisons], progress: comparisons.length, total: comparisons.length })
      } catch {}
    }
  }

  await persistParty(party.slug, comparisons, currentProposals, currentVoteCount)
  console.log(`[preload] ${party.name} : cache mis à jour et sauvegardé`)
}

// Analyse complète (premier lancement ou cache corrompu)
async function fullPreloadParty(party) {
  console.log(`[preload] Début analyse complète : ${party.name}`)
  cache.set(party.slug, { status: 'loading', comparisons: [], progress: 0, total: 0 })
  try {
    const proposals = await fetchProposals(party.slug)
    console.log(`[preload] ${party.name} : ${proposals.length} propositions récupérées`)
    cache.set(party.slug, { status: 'loading', comparisons: [], progress: 0, total: proposals.length })

    const comparisons = []
    for (let i = 0; i < proposals.length; i++) {
      try {
        const result = await compareProposal(proposals[i], party.group)
        const voteCount = result.relatedVotes?.length || 0
        console.log(`[preload] ${party.name} [${i + 1}/${proposals.length}] "${proposals[i].title}": ${voteCount} votes liés`)
        comparisons.push({ proposal: proposals[i], ...result })
      } catch (e) {
        console.warn(`[preload] ${party.name} proposition ${i + 1} échouée:`, e.message)
        comparisons.push({ proposal: proposals[i], status: 'unknown', relatedVotes: [], usedOllama: false })
      }
      cache.set(party.slug, { status: 'loading', comparisons: [...comparisons], progress: i + 1, total: proposals.length })
    }

    cache.set(party.slug, { status: 'ready', comparisons, progress: proposals.length, total: proposals.length })

    let voteCount = 0
    try { voteCount = (await getVotes()).length } catch {}
    await persistParty(party.slug, comparisons, proposals, voteCount)
    console.log(`[preload] ${party.name} : terminé et sauvegardé sur disque`)
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

export async function preloadAllParties() {
  if (global._preloadStarted) return
  global._preloadStarted = true
  console.log('[preload] Démarrage...')
  for (const party of PARTIES) {
    await preloadParty(party)
  }
  console.log('[preload] Toutes les analyses terminées (ou chargées depuis le cache)')
}
