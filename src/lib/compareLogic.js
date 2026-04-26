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
      stream: false,
      num_gpu: 1,
      num_thread: 2,
      keep_alive: '5m'
    }),
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) throw new Error('Ollama unavailable')
  const data = await res.json()
  return data.response || ''
}

function scoreVote(vote, keywords) {
  const text = (vote.titre + ' ' + vote.objet + ' ' + (vote.exposeSommaire || '') + ' ' + (vote.dispositif || '')).toLowerCase()
  return keywords.filter((k) => text.includes(k)).length
}

async function analyzeConsistency(proposal, relatedVotes, partyGroup) {
  if (relatedVotes.length === 0) return { status: 'unknown', explanation: 'Aucun vote lié trouvé.' }

  const positions = relatedVotes.flatMap((vote) => {
    const group = (vote.groupes || []).find((g) => g.organeRef === partyGroup)
    return group ? { position: group.positionMajoritaire, titre: vote.titre } : []
  })

  if (positions.length === 0) return { status: 'unknown', explanation: 'Le groupe n\'a pas voté.' }

  // Prompt utilisant titre ET description
  const votesSummary = positions.map((p) => `${p.position}: ${p.titre}`).join('\n')

  // Construire une description détaillée de la proposition
  let proposalDescription = ''
  if (typeof proposal === 'object') {
    proposalDescription = `Titre: ${proposal.title || ''}\nDescription: ${proposal.description || ''}`
  } else {
    proposalDescription = proposal
  }

  const prompt = `PROPOSITION DU PROGRAMME:
${proposalDescription}

VOTES DU PARTI SUR CE SUJET:
${votesSummary}

Analyse si cette proposition est COHÉRENTE avec les votes du groupe parlementaire du parti.
Considère BOTH le titre ET la description pour une analyse sémantique complète.
Considère que voter CONTRE une proposition mauvaise est BON et cohérent.

Réponds UNIQUEMENT avec l'un de ces mots, suivi d'une brève explication (1-2 phrases):
- "cohérent" si la proposition est alignée avec les votes
- "contradictoire" si la proposition va contre les votes
- "mitigé" si les votes sont mixtes ou nuancés`

  try {
    const response = await ollamaGenerate(prompt, 20000)
    const isCoherent = response.toLowerCase().includes('cohérent') && !response.toLowerCase().includes('contradictoire')
    const isMitigated = response.toLowerCase().includes('mitigé')

    let status = 'unknown'
    if (isCoherent) status = 'respected'
    else if (isMitigated) status = 'mitigated'
    else status = 'notRespected'

    return { status, explanation: response.trim() }
  } catch {
    // Fallback basé sur les votes simples
    const pour = positions.filter((p) => p.position === 'pour').length
    const contre = positions.filter((p) => p.position === 'contre').length

    let status = 'unknown'
    if (pour > contre) status = 'respected'
    else if (contre > pour) status = 'notRespected'
    else if (pour > 0 && contre > 0) status = 'mitigated'

    return { status, explanation: `${pour} pour, ${contre} contre.` }
  }
}

export async function compareProposal(proposal, partyGroup) {
  // Gérer les propositions comme string ou objet {title, description, text}
  const proposalText = typeof proposal === 'string' ? proposal : (proposal.text || proposal.title || '')
  const proposalTitle = typeof proposal === 'string' ? proposal : proposal.title
  const proposalDescription = typeof proposal === 'string' ? '' : proposal.description

  // Charger les votes (sequentiel, pas parallèle)
  const votes = await getVotes()
  const groupsMap = await getGroupsMap().catch(() => new Map())

  // Mots-clés sans appel IA (trop lourd)
  const proposalWords = proposalText.toLowerCase().split(/[\s,.'«»()\-:;!?]+/).filter((w) => w.length > 2)

  // Chercher les votes correspondants (max possible)
  const candidates = votes
    .map((vote) => ({ vote, score: scoreVote(vote, proposalWords) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ vote }) => vote)

  console.log(`[compareProposal] ${proposalTitle}: ${votes.length} votes totaux, ${candidates.length} candidats trouvés`)

  if (candidates.length === 0) {
    return { status: 'unknown', relatedVotes: [], usedOllama: false }
  }

  // Prompt avec descriptions complètes pour meilleure pertinence
  const voteList = candidates.map((v, i) => {
    const desc = v.objet && v.objet !== v.titre ? `\n  Description: ${v.objet}` : ''
    return `${i}. ${v.titre}${desc}`
  }).join('\n\n')
  const prompt = `PROPOSITION DU PROGRAMME:
"${proposalText}"

AMENDEMENTS ET VOTES PARLEMENTAIRES DISPONIBLES:
${voteList}

Identifie les NUMÉROS de tous les amendements qui traitent du MÊME SUJET ou d'un sujet ÉTROITEMENT LIÉ à la proposition.
Sois STRICT: ne sélectionne que les amendements vraiment pertinents.
Réponds avec juste les numéros (ex: 0 2 5) ou "aucun".`

  let relatedVotes = []
  let usedOllama = false

  try {
    const response = await ollamaGenerate(prompt, 30000)
    usedOllama = true
    console.log(`[compareProposal] Ollama response: "${response.substring(0, 100)}"`)
    if (response && !response.toLowerCase().includes('aucun')) {
      const indices = [...response.matchAll(/\d+/g)]
        .map((m) => parseInt(m[0]))
        .filter((i) => i >= 0 && i < candidates.length)
      relatedVotes = [...new Set(indices)].map((i) => candidates[i])
    }
  } catch (err) {
    console.log(`[compareProposal] Ollama erreur: ${err.message}`)
  }

  // Si Ollama n'a rien trouvé, utiliser fallback (score >= 1 pour max possible)
  if (relatedVotes.length === 0) {
    relatedVotes = candidates.filter((v) => scoreVote(v, proposalWords) >= 1)
    console.log(`[compareProposal] Fallback: ${relatedVotes.length} votes sélectionnés (score >= 1)`)
  }

  // Si trop de votes trouvés, demander à l'IA d'être plus strict
  if (relatedVotes.length > 50) {
    console.log(`[compareProposal] Trop de votes (${relatedVotes.length}), demande strictness à Ollama...`)
    try {
      const strictVoteList = relatedVotes.map((v, i) => {
        const desc = v.objet && v.objet !== v.titre ? `\n  Description: ${v.objet}` : ''
        return `${i}. ${v.titre}${desc}`
      }).join('\n\n')

      const strictPrompt = `PROPOSITION: "${proposalText}"

AMENDEMENTS SÉLECTIONNÉS (${relatedVotes.length} total):
${strictVoteList}

Sélectionne UNIQUEMENT les 5 à 20 amendements ABSOLUMENT LES PLUS PERTINENTS.
Sois EXTRÊMEMENT STRICT - élimine tous les amendements vaguement liés.
Réponds avec les numéros ou "aucun".`

      const strictResponse = await ollamaGenerate(strictPrompt, 30000)
      if (strictResponse && !strictResponse.toLowerCase().includes('aucun')) {
        const strictIndices = [...strictResponse.matchAll(/\d+/g)]
          .map((m) => parseInt(m[0]))
          .filter((i) => i >= 0 && i < relatedVotes.length)
        if (strictIndices.length > 0) {
          relatedVotes = [...new Set(strictIndices)].map((i) => relatedVotes[i])
          console.log(`[compareProposal] Après filtrage strict: ${relatedVotes.length} votes`)
        }
      }
    } catch {
      // Si strict filtering échoue, limiter à 100 max
      relatedVotes = relatedVotes.slice(0, 100)
      console.log(`[compareProposal] Strict filtering échoué, limité à ${relatedVotes.length}`)
    }
  }

  console.log(`[compareProposal] Votes liés finaux: ${relatedVotes.length}`)

  const relatedWithGroups = relatedVotes.map((vote) => ({
    ...vote,
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

  const { status, explanation } = await analyzeConsistency(proposalText, relatedWithGroups, partyGroup)
  return {
    status,
    explanation,
    relatedVotes: relatedWithGroups,
    usedOllama: true,
    title: proposalTitle,
    description: proposalDescription,
  }
}
