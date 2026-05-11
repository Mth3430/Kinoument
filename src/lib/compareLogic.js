import { getVotes } from './votesCache'
import { getAmendmentText } from './amendmentsCache'
import { getGroupsMap } from './groupsCache'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3'

async function ollamaGenerate(prompt, timeout = null) {
  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false
    }),
  }

  // Only add timeout if specified
  if (timeout !== null) {
    fetchOptions.signal = AbortSignal.timeout(timeout)
  }

  const res = await fetch(OLLAMA_URL, fetchOptions)
  if (!res.ok) throw new Error('Ollama unavailable')
  const data = await res.json()
  return data.response || ''
}

// STRICT HEURISTIC MATCHING - NO AI
// Better to return 0 votes than wrong votes
async function findMatchingVotes(proposalText, allVotes, themes = []) {
  if (!allVotes || allVotes.length === 0) return []

  // Filter out party names - only real policy themes
  const partyNames = new Set([
    'renaissance', 'rassemblement national', 'la france insoumise', 'les républicains',
    'socialistes et apparentés', 'socialistes', 'europe écologie les verts', 'verts',
    'parti communiste', 'communiste', 'reconquête', 're', 'ps', 'lfi', 'rn', 'eelv', 'pcf'
  ])

  const realThemes = themes.filter(t => {
    const themeName = (t.name || t).toLowerCase().trim()
    return !partyNames.has(themeName) && themeName.length > 3
  })

  // CRITICAL: Without themes, we can't match reliably
  if (realThemes.length === 0) return []

  // Build theme keywords - EXACT matching only
  const themeKeywords = new Set()
  realThemes.forEach(t => {
    const themeName = (t.name || t).toLowerCase()
    themeKeywords.add(themeName)
    themeName.split(/\s+/).forEach(word => {
      if (word.length > 3) themeKeywords.add(word)
    })
  })

  console.log(`[findMatchingVotes] Theme keywords: ${Array.from(themeKeywords).join(', ')}`)

  // STRICT MATCHING RULES
  const matchingVotes = allVotes
    .map(vote => {
      const voteText = (
        (vote.titre || '') + ' ' +
        (vote.objet || '') + ' ' +
        (vote.amendmentDescription || '')
      ).toLowerCase()

      // COUNT: How many theme keywords does this vote mention?
      const themeMatchCount = [...themeKeywords].filter(kw => voteText.includes(kw)).length

      // REQUIREMENT: Must mention theme keywords (minimum 1)
      if (themeMatchCount === 0) return null

      // REJECTION: List of completely unrelated domains - if vote mentions these, reject it
      const rejectDomains = [
        'agriculture', 'agroalimentaire', 'élevage', 'culture', 'art', 'cinéma',
        'inflation', 'marges', 'prix', 'commerce', 'textile', 'sport', 'plein emploi'
      ]

      const hasRejectKeyword = rejectDomains.some(domain => voteText.includes(domain))

      // If vote mentions unrelated domain AND low theme match, reject
      if (hasRejectKeyword && themeMatchCount <= 1) {
        return null
      }

      return { vote, themeMatchCount }
    })
    .filter(v => v !== null)
    .sort((a, b) => b.themeMatchCount - a.themeMatchCount)
    .slice(0, 10)
    .map(item => item.vote)

  console.log(`[findMatchingVotes] Found ${matchingVotes.length} votes (strict heuristics)`)
  return matchingVotes
}

// Enrich matching votes with amendment descriptions
async function enrichVotesWithAmendments(matchingVotes) {
  const BATCH_SIZE = 8
  const enriched = []

  for (let i = 0; i < matchingVotes.length; i += BATCH_SIZE) {
    const batch = matchingVotes.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (vote) => {
        const enrichedVote = { ...vote }
        if (vote.amendementNumero) {
          try {
            const amendmentData = await getAmendmentText(vote.amendementNumero)
            if (amendmentData) {
              const description = amendmentData.exposeSommaire || amendmentData.dispositif
              enrichedVote.amendmentDescription = description || vote.titre || `Amendement n° ${vote.amendementNumero}`
            } else {
              enrichedVote.amendmentDescription = vote.titre || `Amendement n° ${vote.amendementNumero}`
            }
          } catch {
            enrichedVote.amendmentDescription = vote.titre || `Amendement n° ${vote.amendementNumero}`
          }
        } else {
          enrichedVote.amendmentDescription = vote.titre || ''
        }
        return enrichedVote
      })
    )
    enriched.push(...batchResults)
  }

  return enriched
}

// Analyze if an amendment is aligned with the proposal
async function analyzeAmendmentAlignment(proposalText, amendmentDescription) {
  if (!amendmentDescription || amendmentDescription.length < 5) return null

  const prompt = `PROPOSITION: "${proposalText}"

AMENDEMENT: "${amendmentDescription}"

Question: Cet amendement SOUTIENT-IL ou S'OPPOSE-T-IL à cette proposition?

Réponds par UN SEUL MOT:
- Réponds "ALIGNÉ" si l'amendement soutient la proposition
- Réponds "CONTRAIRE" si l'amendement s'oppose à la proposition`

  try {
    const response = await ollamaGenerate(prompt)
    if (!response) return null
    const lower = response.toLowerCase().trim()

    if (lower.includes('aligné') || lower.includes('aligne') || lower.includes('soutien') || lower.includes('support') || lower.includes('renforce')) {
      return 'aligned'
    }
    if (lower.includes('contraire') || lower.includes('contrair') || lower.includes('contraîre') || lower.includes('contre') || lower.includes('oppose') || lower.includes('opposition')) {
      return 'opposed'
    }
    return null
  } catch {
    return null
  }
}

// Fallback analysis when amendment alignment cannot be determined
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
    const response = await ollamaGenerate(prompt)
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
async function analyzeConsistency(proposal, matchingVotes, partyGroup, groupsMap, themes = []) {
  if (!matchingVotes || matchingVotes.length === 0) {
    console.log(`[analyzeConsistency] No matching votes`)
    return { status: 'unknown', explanation: 'Aucun vote correspondant à cette proposition.' }
  }

  const proposalText = typeof proposal === 'string' ? proposal : (proposal.text || proposal.title || '')

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

  const votesToAnalyzeMax = votesToAnalyze
  const votesWithAlignment = []
  const BATCH_SIZE = 10

  for (let i = 0; i < votesToAnalyzeMax.length; i += BATCH_SIZE) {
    const batch = votesToAnalyzeMax.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.allSettled(
      batch.map(async ({ vote, partyVote }) => {
        // Simple logic: POUR = coherent, CONTRE = incoherent
        // If vote matched with proposition by theme, the party vote determines coherence
        let isCoherent = partyVote === 'pour' ? true : partyVote === 'contre' ? false : null

        return {
          partyVote,
          alignment: null,
          vote,
          isCoherent
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

  const coherent = votesWithAlignment.filter(v => v.isCoherent === true).length
  const incoherent = votesWithAlignment.filter(v => v.isCoherent === false).length
  const total = votesWithAlignment.length
  const percentage = total > 0 ? Math.round((coherent / total) * 100) : 0

  // Créer une map des infos de cohérence par vote
  const coherenceMap = new Map()
  votesWithAlignment.forEach(({ vote, isCoherent, alignment }) => {
    coherenceMap.set(vote.numero, { isCoherent, alignment })
  })

  // Enrichir matchingVotes avec les infos de cohérence
  const enrichedMatchingVotes = matchingVotes.map(vote => ({
    ...vote,
    isCoherent: coherenceMap.get(vote.numero)?.isCoherent,
    alignment: coherenceMap.get(vote.numero)?.alignment
  }))

  const coherentVotes = enrichedMatchingVotes.filter(v => v.isCoherent === true)
  const incoherentVotes = enrichedMatchingVotes.filter(v => v.isCoherent === false)

  // Filter votes to ensure they contain theme keywords (extra validation)
  const filterVotesByTheme = (votes, themesArray) => {
    if (themesArray.length === 0) return votes
    const themeKeywords = new Set()
    themesArray.forEach(t => {
      const themeName = (t.name || t).toLowerCase()
      themeName.split(/\s+/).forEach(word => {
        if (word.length > 3) themeKeywords.add(word)
      })
    })

    return votes.filter(v => {
      const voteText = ((v.titre || '') + ' ' + (v.objet || '')).toLowerCase()
      return [...themeKeywords].some(keyword => voteText.includes(keyword))
    })
  }

  const coherentVotesFiltered = filterVotesByTheme(coherentVotes, themes)
  const incoherentVotesFiltered = filterVotesByTheme(incoherentVotes, themes)

  // Générer l'explication avec l'IA
  const coherentList = coherentVotesFiltered
    .slice(0, 10)
    .map(v => `- ${v.titre || v.objet || ''}`)
    .join('\n')

  const incoherentList = incoherentVotesFiltered
    .slice(0, 10)
    .map(v => `- ${v.titre || v.objet || ''}`)
    .join('\n')

  const analysisPrompt = `PROPOSITION:
"${proposalText}"

VOTES SOUTENANT LA PROPOSITION (${coherent}/${total}):
${coherentList || '(aucun)'}

VOTES S'OPPOSANT À LA PROPOSITION (${incoherent}/${total}):
${incoherentList || '(aucun)'}

Génère un avis analytique court (2-3 phrases) qui explique la cohérence ou l'incohérence entre ces votes et la proposition. Sois direct et critique. Ne cite pas d'exemples spécifiques.`

  let status = 'unknown'
  let explanation = ''

  try {
    explanation = await ollamaGenerate(analysisPrompt)
    if (!explanation || explanation.length < 20) {
      // Fallback si réponse vide
      if (percentage > 60) {
        explanation = 'Le parti soutient majoritairement cette proposition.'
      } else if (percentage < 33) {
        explanation = 'Le parti s\'oppose globalement à cette proposition.'
      } else {
        explanation = 'Position nuancée: le parti est divisé sur cette proposition.'
      }
    }
  } catch (err) {
    // Fallback minimal si l'IA échoue
    if (percentage > 60) {
      explanation = 'Le parti soutient majoritairement cette proposition.'
    } else if (percentage < 33) {
      explanation = 'Le parti s\'oppose globalement à cette proposition.'
    } else {
      explanation = 'Position nuancée: le parti est divisé sur cette proposition.'
    }
  }

  if (percentage > 60) {
    status = 'respected'
  } else if (percentage < 33) {
    status = 'notRespected'
  } else {
    status = 'mitigated'
  }

  return { status, explanation, relatedVotes: enrichedMatchingVotes }
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

    // Enrich all votes with amendment descriptions for full content matching
    const allVotesEnriched = await enrichVotesWithAmendments(allVotes)

    // Find matching votes for this proposal (including themes) - now with full descriptions
    const themes = typeof proposal === 'string' ? [] : (proposal.themes || [])
    const matchingVotes = await findMatchingVotes(proposalText, allVotesEnriched, themes)

    // If no votes found, return unknown
    if (matchingVotes.length === 0) {
      return {
        status: 'unknown',
        explanation: 'Aucun vote correspondant à cette proposition.',
        relatedVotes: [],
        relatedVotesCount: 0,
        usedOllama: false,
        title: proposalTitle,
        description: proposalDescription,
      }
    }

    const enrichedVotes = matchingVotes

    // Simple logic: Find party position in each vote and determine coherence
    const relatedWithGroups = enrichedVotes.map((vote) => {
      const groupMatch = (vote.groupes || []).find((g) => g.organeRef === partyGroup)
      const partyVote = groupMatch?.positionMajoritaire

      // Coherence: POUR = respected, CONTRE = notRespected
      let status = 'unknown'
      let explanation = ''

      if (partyVote === 'pour') {
        status = 'respected'
        explanation = 'Le parti a voté pour cette proposition.'
      } else if (partyVote === 'contre') {
        status = 'notRespected'
        explanation = 'Le parti a voté contre cette proposition.'
      } else {
        status = 'unknown'
        explanation = 'Abstention ou position indéterminée.'
      }

      return {
        ...vote,
        status,
        explanation,
        amendmentNumber: vote.amendementNumero,
        amendmentDescription: vote.amendmentDescription,
        groupDetails: groupMatch ? [{
          organeRef: groupMatch.organeRef,
          nom: groupsMap.get(groupMatch.organeRef) || groupMatch.organeRef,
          position: groupMatch.positionMajoritaire || 'abstention',
        }] : [],
      }
    })

    // Determine overall status from votes
    const statuses = relatedWithGroups.map(v => v.status).filter(s => s !== 'unknown')
    const respected = statuses.filter(s => s === 'respected').length
    const notRespected = statuses.filter(s => s === 'notRespected').length

    let overallStatus = 'unknown'
    let overallExplanation = ''

    if (statuses.length > 0) {
      if (respected > notRespected) {
        overallStatus = 'respected'
        overallExplanation = `Le parti a voté pour cette proposition dans ${respected}/${statuses.length} votes.`
      } else if (notRespected > respected) {
        overallStatus = 'notRespected'
        overallExplanation = `Le parti a voté contre cette proposition dans ${notRespected}/${statuses.length} votes.`
      } else {
        overallStatus = 'mitigated'
        overallExplanation = `Le parti est divisé: ${respected} votes pour et ${notRespected} votes contre.`
      }
    }

    return {
      status: overallStatus,
      explanation: overallExplanation,
      relatedVotes: relatedWithGroups,
      relatedVotesCount: relatedWithGroups.length,
      usedOllama: false,
      title: proposalTitle,
      description: proposalDescription,
    }
  } catch (err) {
    console.error(`[compareProposal] Error for "${proposalTitle}":`, err.message)
    return {
      status: 'unknown',
      explanation: `Erreur lors de la comparaison: ${err.message}`,
      relatedVotes: [],
      relatedVotesCount: 0,
      usedOllama: false,
      title: proposalTitle,
      description: proposalDescription,
    }
  }
}
