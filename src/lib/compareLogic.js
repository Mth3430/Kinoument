import { getVotes } from './votesCache'
import { getAmendmentText } from './amendmentsCache'
import { getGroupsMap } from './groupsCache'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3'

async function ollamaGenerate(prompt, timeout = 45000) {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false
    }),
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error('Ollama unavailable')
  const data = await res.json()
  return data.response || ''
}

// Extract keywords from proposal
async function extractProposalKeywords(proposalText) {
  // Quick keyword extraction without AI
  // Remove common stop words
  const stopWords = new Set([
    'le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'un', 'une', 'à', 'pour', 'par',
    'en', 'au', 'aux', 'avec', 'sans', 'sur', 'sous', 'dans', 'entre', 'vers',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'of', 'to', 'from', 'with'
  ])

  // Extract words
  const words = proposalText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))

  // Get most common words
  const freq = {}
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1
  })

  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)

  return keywords
}

// Find matching votes for a proposal - with two strategies
async function findMatchingVotes(proposalText, allVotes) {
  if (!allVotes || allVotes.length === 0) return []

  // Strategy 1: Extract keywords and search for relevant votes
  const keywords = await extractProposalKeywords(proposalText)
  console.log(`[compareLogic] Keywords: ${keywords.join(', ')}`)

  let matchingVotes = []

  if (keywords.length > 0) {
    // Search votes containing these keywords
    matchingVotes = allVotes.filter(v => {
      const voteText = ((v.titre || '') + ' ' + (v.objet || '')).toLowerCase()
      return keywords.some(kw => voteText.includes(kw))
    })

    console.log(`[compareLogic] ${matchingVotes.length} votes trouvés par mots-clés`)
  }

  // Strategy 2: If still no matches, do semantic matching with AI
  if (matchingVotes.length === 0) {
    const voteList = allVotes
      .slice(0, 50)
      .map((v, i) => `${i}. [Vote #${v.numero}] ${(v.titre || v.objet || '').substring(0, 120)}`)
      .join('\n\n')

    const prompt = `PROPOSITION:
"${proposalText}"

VOTES DISPONIBLES:
${voteList}

Identifie les NUMÉROS des votes liés au thème de cette proposition (même domaine, même sujet).
Sois FLEXIBLE - votes partiellement liés sont OK.
Réponds avec juste les numéros (ex: 2004 2050) ou "aucun".`

    try {
      const response = await ollamaGenerate(prompt, 15000)
      if (!response.toLowerCase().includes('aucun')) {
        const numbers = [...response.matchAll(/\d+/g)]
          .map(m => parseInt(m[0]))
        matchingVotes = allVotes.filter(v => numbers.includes(parseInt(v.numero)))
      }
    } catch (err) {
      console.log(`[compareLogic] Semantic matching error:`, err.message)
    }
  }

  return matchingVotes
}

// Enrich matching votes with amendment descriptions
async function enrichVotesWithAmendments(matchingVotes) {
  const enriched = []

  for (const vote of matchingVotes) {
    const enrichedVote = { ...vote }

    // Try to load amendment details if amendment number exists
    if (vote.amendementNumero) {
      try {
        const amendmentData = await getAmendmentText(vote.amendementNumero)
        if (amendmentData && (amendmentData.exposeSommaire || amendmentData.dispositif)) {
          enrichedVote.amendmentDescription = amendmentData.exposeSommaire || amendmentData.dispositif
          enrichedVote.amendmentAuthor = amendmentData.auteur
        }
      } catch (err) {
        // Silent fail - use vote description if amendment not available
      }
    }

    enriched.push(enrichedVote)
  }

  return enriched
}

// Analyze if an amendment is aligned with the proposal
async function analyzeAmendmentAlignment(proposalText, amendmentDescription) {
  if (!amendmentDescription || amendmentDescription.length < 5) return null

  const prompt = `PROPOSITION DU PARTI:
"${proposalText}"

AMENDEMENT:
"${amendmentDescription}"

Cet amendement est-il ALIGNÉ ou CONTRAIRE? Réponds: "aligné" ou "contraire"`

  try {
    const response = await ollamaGenerate(prompt, 15000)
    const lower = response.toLowerCase().trim()
    if (lower.includes('aligné')) return 'aligned'
    if (lower.includes('contraire')) return 'opposed'
    return null
  } catch {
    return null
  }
}

// Fallback analysis when amendment alignment cannot be determined
// Deep AI analysis - STRICT: always use AI, no fallback heuristics
async function aiBasedAnalysis(proposal, matchingVotes) {
  if (!matchingVotes || matchingVotes.length === 0) {
    return { status: 'unknown', explanation: 'Aucun vote correspondant à cette proposition.' }
  }

  const proposalText = typeof proposal === 'string' ? proposal : (proposal.text || proposal.title || '')

  // Get amendments to analyze
  const amendmentsToAnalyze = matchingVotes
    .filter(v => v.amendmentDescription || v.amendementDescription)
    .slice(0, 15)

  if (amendmentsToAnalyze.length === 0) {
    return {
      status: 'unknown',
      explanation: 'Pas d\'amendements disponibles pour cette analyse.',
      relatedVotes: matchingVotes
    }
  }

  // Build amendment list for AI
  const amendmentsList = amendmentsToAnalyze
    .map((v, i) => `${i + 1}. ${v.titre}\n${v.amendmentDescription || v.amendementDescription || ''}`)
    .join('\n\n---\n\n')

  const prompt = `PROPOSITION DU PARTI:
"${proposalText}"

AMENDEMENTS QUE LE PARTI A PROPOSÉ OU DISCUTÉ:
${amendmentsList}

ANALYSE REQUISE:
Ces amendements soutiennent-ils ou contredisent-ils la proposition du parti?

RÉPONSE:
Donne une analyse constructive (2-3 phrases) qui explique clairement la cohérence ou l'incohérence entre les amendements et la proposition. Sois direct et analyste.`

  try {
    const response = await ollamaGenerate(prompt, 15000)
    if (response && response.length > 20) {
      // Determine status from AI response
      const lower = response.toLowerCase()
      let status = 'unknown'

      if (lower.includes('cohérent') || lower.includes('soutien') || lower.includes('renforce') || lower.includes('aligné')) {
        status = 'respected'
      } else if (lower.includes('contradict') || lower.includes('opposé') || lower.includes('incohér')) {
        status = 'notRespected'
      } else if (lower.includes('mixte') || lower.includes('nuancé') || lower.includes('mitigé') || lower.includes('et')) {
        status = 'mitigated'
      }

      return {
        status,
        explanation: response.trim(),
        relatedVotes: matchingVotes
      }
    }
  } catch (err) {
    console.log(`[compareLogic] AI analysis error:`, err.message)
  }

  // If AI fails, return unknown - no fallback
  return {
    status: 'unknown',
    explanation: 'Analyse IA non disponible pour cette proposition.',
    relatedVotes: matchingVotes
  }
}

// Analyze party consistency based on amendment content alignment
async function analyzeConsistency(proposal, matchingVotes, partyGroup, groupsMap) {
  if (!matchingVotes || matchingVotes.length === 0) {
    return { status: 'unknown', explanation: 'Aucun vote correspondant à cette proposition.' }
  }

  const proposalText = typeof proposal === 'string' ? proposal : (proposal.text || proposal.title || '')

  // Prepare votes for analysis
  const votesToAnalyze = matchingVotes
    .map((vote) => {
      const group = (vote.groupes || []).find((g) => g.organeRef === partyGroup)
      const partyVote = group?.positionMajoritaire
      return partyVote ? { vote, partyVote } : null
    })
    .filter(Boolean)

  if (votesToAnalyze.length === 0) {
    return aiBasedAnalysis(proposal, matchingVotes)
  }

  // Analyze votes with amendment descriptions in parallel batches
  // Limit to 15 votes max for thorough analysis (3s * 15/5 batches ~ 9s)
  const votesToAnalyzeMax = votesToAnalyze.slice(0, 15)
  const votesWithAlignment = []
  const BATCH_SIZE = 5

  for (let i = 0; i < votesToAnalyzeMax.length; i += BATCH_SIZE) {
    const batch = votesToAnalyzeMax.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.allSettled(
      batch.map(async ({ vote, partyVote }) => {
        const amendmentDesc = vote.amendmentDescription || vote.amendementDescription || vote.titre
        const alignment = await analyzeAmendmentAlignment(proposalText, amendmentDesc)

        return {
          partyVote,
          alignment,
          vote,
          isCoherent: alignment ? (
            (alignment === 'aligned' && partyVote === 'pour') ||
            (alignment === 'opposed' && partyVote === 'contre')
          ) : null
        }
      })
    )

    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        votesWithAlignment.push(result.value)
      }
    })
  }

  if (votesWithAlignment.length === 0) {
    return aiBasedAnalysis(proposal, matchingVotes)
  }

  // Analyze coherence based on amendment alignment
  const coherent = votesWithAlignment.filter(v => v.isCoherent === true).length
  const incoherent = votesWithAlignment.filter(v => v.isCoherent === false).length
  const unknown = votesWithAlignment.filter(v => v.isCoherent === null).length

  let status = 'unknown'
  let explanation = ''

  if (coherent > incoherent) {
    status = 'respected'
    explanation = `${coherent}/${votesWithAlignment.length} votes sont cohérents avec la proposition (le parti a voté pour les amendements alignés et contre les contraires).`
  } else if (incoherent > coherent) {
    status = 'notRespected'
    explanation = `${incoherent}/${votesWithAlignment.length} votes sont incohérents avec la proposition (le parti a voté contre les amendements alignés ou pour les contraires).`
  } else if (coherent > 0) {
    status = 'mitigated'
    explanation = `${coherent} votes cohérents et ${incoherent} incohérents. Position mitigée.`
  } else if (unknown > 0) {
    status = 'unknown'
    explanation = `Impossible de déterminer précisément l'alignement (${unknown}/${votesWithAlignment.length} amendements non évaluables).`
  }

  return { status, explanation, relatedVotes: matchingVotes }
}

export async function compareProposal(proposal, partyGroup) {
  const proposalText = typeof proposal === 'string' ? proposal : (proposal.text || proposal.title || '')
  const proposalTitle = typeof proposal === 'string' ? proposal : proposal.title
  const proposalDescription = typeof proposal === 'string' ? '' : proposal.description

  try {
    // Load all data
    const [allVotes, groupsMap] = await Promise.all([
      getVotes(),
      getGroupsMap().catch(() => new Map())
    ])

    console.log(`[compareProposal] "${proposalTitle}" - recherche votes correspondants...`)

    // Find matching votes for this proposal
    const matchingVotes = await findMatchingVotes(proposalText, allVotes)
    console.log(`[compareProposal] ${matchingVotes.length} votes trouvés pour "${proposalTitle}"`)

    // If no votes found, return unknown
    if (matchingVotes.length === 0) {
      return {
        status: 'unknown',
        explanation: 'Aucun vote correspondant à cette proposition.',
        relatedVotes: [],
        usedOllama: false,
        title: proposalTitle,
        description: proposalDescription,
      }
    }

    // Enrich votes with amendment descriptions
    const enrichedVotes = await enrichVotesWithAmendments(matchingVotes)

    // Analyze consistency based on these votes
    const { status, explanation, relatedVotes = [] } = await analyzeConsistency(
      proposalText,
      enrichedVotes,
      partyGroup,
      groupsMap
    )

    // Enrich votes with group details
    const relatedWithGroups = relatedVotes.map((vote) => ({
      ...vote,
      amendmentNumber: vote.amendementNumero,
      amendmentDescription: vote.amendmentDescription,
      groupDetails: (vote.groupes || [])
        .filter((g) => g.positionMajoritaire)
        .map((g) => ({
          organeRef: g.organeRef,
          nom: groupsMap.get(g.organeRef) || g.organeRef,
          position: g.positionMajoritaire,
        }))
        .sort((a, b) => {
          const order = { pour: 0, abstention: 1, contre: 2 }
          return (order[a.position] ?? 3) - (order[b.position] ?? 3)
        }),
    }))

    return {
      status,
      explanation,
      relatedVotes: relatedWithGroups,
      usedOllama: true,
      title: proposalTitle,
      description: proposalDescription,
    }
  } catch (err) {
    console.error(`[compareProposal] Error for "${proposalTitle}":`, err.message)
    return {
      status: 'unknown',
      explanation: `Erreur lors de la comparaison: ${err.message}`,
      relatedVotes: [],
      usedOllama: false,
      title: proposalTitle,
      description: proposalDescription,
    }
  }
}
