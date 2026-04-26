import { parse } from 'node-html-parser'

const VALID_PARTIES = [
  'renaissance',
  'les-republicains',
  'la-france-insoumise',
  'rassemblement-national',
  'parti-socialiste',
  'europe-ecologie-les-verts',
  'parti-communiste-francais',
  'reconquete',
  'place-publique',
]

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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { slug } = req.query

  if (!slug || !VALID_PARTIES.includes(slug)) {
    return res.status(400).json({ error: 'Invalid party slug' })
  }

  try {
    const baseUrl = `https://tous-les-programmes.fr/partis/${slug}`
    const totalPages = await getTotalPages(slug)
    console.log(`[api/program] ${slug}: ${totalPages} pages détectées`)

    let allProposals = []

    for (let page = 1; page <= totalPages; page++) {
      const pageUrl = page === 1 ? baseUrl : `${baseUrl}?page=${page}`
      try {
        const pageProposals = await fetchPageProposals(pageUrl)
        allProposals = [...allProposals, ...pageProposals]
        console.log(`[api/program] ${slug}: page ${page}/${totalPages} - ${pageProposals.length} propositions`)
      } catch (e) {
        console.warn(`[api/program] ${slug}: erreur page ${page}:`, e.message)
      }
    }

    console.log(`[api/program] ${slug}: total ${allProposals.length} propositions`)

    res.status(200).json({
      proposals: allProposals,
      count: allProposals.length
    })
  } catch (error) {
    console.error(`[api/program] ${slug}: erreur:`, error.message)
    res.status(502).json({ error: 'Failed to fetch party program: ' + error.message })
  }
}
