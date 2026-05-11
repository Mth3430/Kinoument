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

// Extract keywords from proposal - very strict
async function extractProposalKeywords(proposalText) {
  const stopWords = new Set([
    'le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'un', 'une', 'à', 'pour', 'par',
    'en', 'au', 'aux', 'avec', 'sans', 'sur', 'sous', 'dans', 'entre', 'vers',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'of', 'to', 'from', 'with',
    // Add generic/structural words
    'article', 'projet', 'loi', 'amendement', 'examen', 'prioritaire', 'disposition',
    'dispositions', 'texte', 'rapport', 'commission', 'vote', 'votes', 'lassemblee',
    'assemblee', 'nationale', 'senat', 'chambre', 'lecture', 'premiere', 'deuxieme',
    'propose', 'proposition', 'cet', 'cette', 'ces', 'celui', 'celle', 'ceux',
    'est', 'sont', 'stre', 'etre', 'pas', 'plus', 'autre', 'autres'
  ])

  const words = proposalText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4 && !stopWords.has(w))

  const freq = {}
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1
  })

  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word)

  return keywords
}

// Find matching votes: keyword pre-filter, then AI validation. If nothing found, send all votes to AI
async function findMatchingVotes(proposalText, allVotes, themes = []) {
  if (!allVotes || allVotes.length === 0) return []

  // Extract keywords from proposal text
  const keywords = await extractProposalKeywords(proposalText)

  // Also add theme names as keywords
  const partyNames = new Set([
    'renaissance', 'rassemblement national', 'la france insoumise', 'les républicains',
    'socialistes et apparentés', 'socialistes', 'europe écologie les verts', 'verts',
    'parti communiste', 'communiste', 'reconquête', 're', 'ps', 'lfi', 'rn', 'eelv', 'pcf'
  ])

  const themeKeywords = []
  themes.forEach(t => {
    const themeName = (t.name || t).toLowerCase().trim()
    if (!partyNames.has(themeName) && themeName.length > 3) {
      themeKeywords.push(themeName)
    }
  })

  const allKeywords = [...keywords, ...themeKeywords]

  // Step 1: Try pre-filter with keywords
  let candidateVotes = []
  if (allKeywords.length > 0) {
    candidateVotes = allVotes
      .map((vote, idx) => {
        const voteText = (
          (vote.titre || '') + ' ' +
          (vote.objet || '') + ' ' +
          (vote.amendmentDescription || '')
        ).toLowerCase()

        const matchCount = allKeywords.filter(kw => voteText.includes(kw)).length
        return { vote, idx, matchCount }
      })
      .filter(item => item.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 50)
  }

  // If keywords found votes, validate with AI
  if (candidateVotes.length > 0) {
    const votesList = candidateVotes
      .map((item, i) => {
        const desc = (item.vote.amendmentDescription || item.vote.objet || '').substring(0, 150)
        return `${i}. ${item.vote.titre}\n${desc || '(pas de description)'}`
      })
      .join('\n\n---\n\n')

    const aiValidationPrompt = `PROPOSITION:
"${proposalText.substring(0, 500)}"

VOTES/AMENDEMENTS (candidats):
${votesList}

TÂCHE: Identifie TOUS les votes qui sont VRAIMENT EN RAPPORT avec cette proposition.
Sois strict: un vote ne doit pas juste partager un mot-clé, il doit traiter le MÊME SUJET.

Retourne les index des votes pertinents (ex: 0 2 5) ou "aucun" si aucun n'est pertinent.`

    try {
      const aiResponse = await ollamaGenerate(aiValidationPrompt)
      if (!aiResponse.toLowerCase().includes('aucun')) {
        const selectedIndices = [...aiResponse.matchAll(/\d+/g)]
          .map(m => parseInt(m[0]))
        const selectedVotes = selectedIndices
          .map(idx => candidateVotes[idx]?.vote)
          .filter(v => v)
          .slice(0, 15)

        if (selectedVotes.length > 0) {
          return selectedVotes
        }
      }
    } catch (err) {
      console.log(`[findMatchingVotes] AI validation with keywords failed:`, err.message)
    }
  }

  // Step 2: No votes found with keywords - validate a sample of votes without pre-filter
  console.log(`[findMatchingVotes] No keyword matches, sampling votes for AI validation...`)

  // Take a sample of 100 votes instead of ALL (randomized to get variety)
  const sampleSize = Math.min(100, allVotes.length)
  const sampleVotes = allVotes.slice(0, sampleSize)

  const votesList = sampleVotes
    .map((vote, idx) => {
      const desc = (vote.amendmentDescription || vote.objet || '').substring(0, 100)
      return `${idx}. ${vote.titre}\n${desc || '(pas de description)'}`
    })
    .join('\n\n---\n\n')

  const aiValidationPrompt = `PROPOSITION:
"${proposalText.substring(0, 500)}"

VOTES/AMENDEMENTS (sample de ${sampleSize} votes):
${votesList}

TÂCHE: Identifie les votes VRAIMENT EN RAPPORT avec cette proposition.
Sois strict - le vote doit traiter le MÊME SUJET.

Retourne les index des votes pertinents (ex: 0 2 5) ou "aucun".`

  try {
    const aiResponse = await ollamaGenerate(aiValidationPrompt)
    if (!aiResponse.toLowerCase().includes('aucun')) {
      const selectedIndices = [...aiResponse.matchAll(/\d+/g)]
        .map(m => parseInt(m[0]))
      const selectedVotes = selectedIndices
        .map(idx => sampleVotes[idx])
        .filter(v => v)
        .slice(0, 15)

      if (selectedVotes.length > 0) {
        return selectedVotes
      }
    }
  } catch (err) {
    console.log(`[findMatchingVotes] Sample validation failed:`, err.message)
  }

  return []
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
        const amendmentDesc = vote.amendmentDescription || vote.amendementDescription || vote.titre
        const alignment = await analyzeAmendmentAlignment(proposalText, amendmentDesc)

        // Si alignment est déterminé, l'utiliser. Sinon, utiliser la position du vote
        let isCoherent = null
        if (alignment) {
          isCoherent = (alignment === 'aligned' && partyVote === 'pour') ||
                       (alignment === 'opposed' && partyVote === 'contre')
        } else {
          // Indéterminé: pour = cohérent (vert), contre = incohérent (rouge), abstention = null
          isCoherent = partyVote === 'pour' ? true : partyVote === 'contre' ? false : null
        }

        return {
          partyVote,
          alignment,
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

    // Analyze consistency based on these votes
    const { status, explanation, relatedVotes = [] } = await analyzeConsistency(
      proposalText,
      enrichedVotes,
      partyGroup,
      groupsMap,
      themes
    )

    // Enrich votes with group details - afficher SEULEMENT le groupe du parti
    const relatedWithGroups = relatedVotes.map((vote) => {
      const groupMatch = (vote.groupes || []).find((g) => g.organeRef === partyGroup)
      return {
        ...vote,
        amendmentNumber: vote.amendementNumero,
        amendmentDescription: vote.amendmentDescription,
        groupDetails: groupMatch ? [{
          organeRef: groupMatch.organeRef,
          nom: groupsMap.get(groupMatch.organeRef) || groupMatch.organeRef,
          position: groupMatch.positionMajoritaire || 'abstention',
        }] : [],
      }
    })

    return {
      status,
      explanation,
      relatedVotes: relatedWithGroups,
      relatedVotesCount: relatedWithGroups.length,
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
      relatedVotesCount: 0,
      usedOllama: false,
      title: proposalTitle,
      description: proposalDescription,
    }
  }
}
