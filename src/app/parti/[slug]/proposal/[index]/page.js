'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '../../../../../components/Navigation'

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug
  const proposalIndex = parseInt(params.index)

  const [proposal, setProposal] = useState(null)
  const [language, setLanguage] = useState('fr')
  const [darkMode, setDarkMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [expandedVote, setExpandedVote] = useState(null)

  const bgColor = darkMode ? '#1f2937' : '#ffffff'
  const textColor = darkMode ? '#f3f4f6' : '#1f2937'
  const cardBg = darkMode ? '#111827' : '#f9fafb'
  const cardBorder = darkMode ? '#374151' : '#e5e7eb'
  const secondaryText = darkMode ? '#d1d5db' : '#6b7280'

  const getStatusColor = (status) => {
    if (status === 'respected') return '#10b981'
    if (status === 'notRespected') return '#ef4444'
    if (status === 'mitigated') return '#f59e0b'
    return '#9ca3af'
  }

  const statusLabel = (status) => {
    const labels = {
      fr: {
        respected: 'Respecté',
        notRespected: 'Non Respecté',
        mitigated: 'Mitigé',
        unknown: 'Inconnu',
        aiLabel: 'IA',
        keywordLabel: 'Mots-clés',
      },
      en: {
        respected: 'Respected',
        notRespected: 'Not Respected',
        mitigated: 'Mitigated',
        unknown: 'Unknown',
        aiLabel: 'AI',
        keywordLabel: 'Keywords',
      }
    }
    return labels[language][status] || 'Inconnu'
  }

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const res = await fetch(`/api/proposal?slug=${slug}&index=${proposalIndex}`)
        const data = await res.json()
        setProposal(data)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
  }, [slug, proposalIndex])

  if (loading) return (
    <main style={{ padding: '2rem', background: bgColor, minHeight: '100vh', color: textColor }}>
      <p>Chargement...</p>
    </main>
  )

  if (!proposal) return (
    <main style={{ padding: '2rem', background: bgColor, minHeight: '100vh', color: textColor }}>
      <p>Proposition non trouvée</p>
      <button onClick={() => router.back()} style={{
        padding: '0.75rem 1.5rem',
        background: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        marginTop: '1rem',
      }}>
        ← Retour
      </button>
    </main>
  )

  return (
    <>
      <Navigation
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        language={language}
        onLanguageChange={setLanguage}
      />
      <main style={{
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        background: bgColor,
        minHeight: '100vh',
        color: textColor,
        transition: 'background 0.3s, color 0.3s',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginBottom: '2rem',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            ← Retour
          </button>

          <div style={{
            background: cardBg,
            border: `2px solid ${
              proposal.status === 'respected' ? '#10b981' :
              proposal.status === 'notRespected' ? '#ef4444' :
              proposal.status === 'mitigated' ? '#f59e0b' : cardBorder
            }`,
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'white',
                background: getStatusColor(proposal.status),
              }}>
                {statusLabel(proposal.status).toUpperCase()}
              </span>
              <span style={{
                marginLeft: '0.75rem',
                fontSize: '0.75rem',
                color: secondaryText,
                fontWeight: '500',
              }}>
                {proposal.relatedVotes?.length ?? 0} votes liés
              </span>
            </div>

            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: textColor,
              margin: '0 0 1rem 0',
              lineHeight: '1.4',
            }}>
              {proposal.proposal.title}
            </h1>

            {proposal.proposal.description && (
              <div style={{
                background: darkMode ? '#1f2937' : '#f3f4f6',
                border: `1px solid ${cardBorder}`,
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.95rem',
                color: secondaryText,
                lineHeight: '1.6',
              }}>
                {proposal.proposal.description}
              </div>
            )}

            {proposal.proposal.themes && proposal.proposal.themes.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '600', color: secondaryText, marginBottom: '0.75rem' }}>
                  Thèmes
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {proposal.proposal.themes.map((theme, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        paddingTop: '0.35rem',
                        paddingBottom: '0.35rem',
                        paddingLeft: '0.75rem',
                        paddingRight: '0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        color: 'white',
                        background: theme.color || '#6B7280',
                      }}
                    >
                      {theme.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              paddingTop: '1rem',
              borderTop: `1px solid ${cardBorder}`,
              marginTop: '1rem',
            }}>
              <span style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                background: proposal.usedOllama ? '#dbeafe' : '#f3f4f6',
                color: proposal.usedOllama ? '#0284c7' : '#6b7280',
                fontWeight: '500',
              }}>
                {proposal.usedOllama ? '🤖 IA' : '🔑 Mots-clés'}
              </span>
            </div>
          </div>

          {proposal.explanation && (
            <div style={{
              background: cardBg,
              border: `1.5px solid #3b82f6`,
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <strong style={{ color: '#3b82f6' }}>💡 Analyse IA:</strong>
              </div>
              <p style={{ margin: 0, color: secondaryText, lineHeight: '1.6' }}>
                {proposal.explanation}
              </p>
            </div>
          )}

          {proposal.relatedVotes && proposal.relatedVotes.length > 0 && (
            <div style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: '12px',
              padding: '1.5rem',
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: textColor,
                margin: '0 0 1.5rem 0',
              }}>
                📜 Votes liés ({proposal.relatedVotes.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {proposal.relatedVotes.map((vote, i) => (
                  <div key={i} style={{
                    border: `3px solid ${
                      vote.isCoherent === true ? '#10b981' :
                      vote.isCoherent === false ? '#ef4444' : cardBorder
                    }`,
                    borderRadius: '8px',
                    padding: '1.5rem',
                    background: vote.isCoherent === true ? (darkMode ? '#064e3b' : '#ecfdf5') :
                               vote.isCoherent === false ? (darkMode ? '#5a1a1a' : '#fef2f2') :
                               darkMode ? '#1f2937' : '#f9fafb',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        background: vote.isCoherent === true ? '#10b981' :
                                   vote.isCoherent === false ? '#ef4444' : '#9ca3af',
                        color: 'white',
                      }}>
                        {vote.isCoherent === true ? '✓ Cohérent' :
                         vote.isCoherent === false ? '✗ Incohérent' : '? Indéterminé'}
                      </span>
                    </div>
                    <h3 style={{ color: textColor, margin: '0 0 0.75rem 0', fontSize: '1.05rem', fontWeight: '600' }}>
                      {vote.titre}
                    </h3>
                    {(vote.amendmentNumber || vote.amendementNumero) && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: darkMode ? '#111827' : '#f0f9ff',
                        border: `1px solid ${darkMode ? '#374151' : '#bfdbfe'}`,
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                      }}>
                        <p style={{ color: '#60a5fa', fontWeight: '500', margin: '0 0 0.5rem 0' }}>
                          🔗 Amendement n° {vote.amendmentNumber || vote.amendementNumero}
                        </p>
                        {vote.amendmentDescription && (
                          <p style={{ color: secondaryText, margin: '0.5rem 0', lineHeight: '1.4' }}>
                            {vote.amendmentDescription.substring(0, 400)}
                            {vote.amendmentDescription.length > 400 ? '…' : ''}
                          </p>
                        )}
                      </div>
                    )}
                    {(vote.objet || vote.exposeSommaire) && (
                      <button
                        onClick={() => setExpandedVote(i)}
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem 1rem',
                          fontSize: '0.85rem',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '500',
                        }}
                      >
                        📄 Voir la description du vote
                      </button>
                    )}
                    {vote.exposeSommaire && (
                      <p style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic', margin: '0.5rem 0', lineHeight: '1.5' }}>
                        {vote.exposeSommaire.slice(0, 300)}{vote.exposeSommaire.length > 300 ? '…' : ''}
                      </p>
                    )}
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>
                      {vote.sort} • {vote.date}
                    </p>

                    {vote.groupDetails && vote.groupDetails.length > 0 && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${cardBorder}` }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: '600', color: secondaryText, margin: '0 0 0.5rem 0' }}>
                          Positions des groupes:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {vote.groupDetails.map((group, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                              <span style={{ fontWeight: '600', color: textColor }}>
                                {group.nom}
                              </span>
                              <span style={{
                                fontWeight: '600',
                                color: group.position === 'pour' ? '#10b981' : group.position === 'contre' ? '#ef4444' : '#f59e0b',
                                textTransform: 'uppercase'
                              }}>
                                {group.position === 'pour' ? 'Pour' : group.position === 'contre' ? 'Contre' : 'Abstention'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {expandedVote !== null && proposal.relatedVotes[expandedVote] && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}>
              <div style={{
                background: cardBg,
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '800px',
                maxHeight: '80vh',
                overflow: 'auto',
                color: textColor,
              }}>
                <h2 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.3rem', fontWeight: '600' }}>
                  {proposal.relatedVotes[expandedVote].titre}
                </h2>

                {(proposal.relatedVotes[expandedVote].amendmentNumber || proposal.relatedVotes[expandedVote].amendementNumero) && (
                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: darkMode ? '#111827' : '#f0f9ff',
                    border: `1px solid ${darkMode ? '#374151' : '#bfdbfe'}`,
                    borderRadius: '8px',
                  }}>
                    <p style={{ color: '#60a5fa', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
                      🔗 Amendement n° {proposal.relatedVotes[expandedVote].amendmentNumber || proposal.relatedVotes[expandedVote].amendementNumero}
                    </p>
                    {proposal.relatedVotes[expandedVote].amendmentDescription && (
                      <p style={{ color: secondaryText, margin: '0.5rem 0', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>
                        <strong>Description:</strong> {proposal.relatedVotes[expandedVote].amendmentDescription}
                      </p>
                    )}
                  </div>
                )}

                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: `1px solid ${cardBorder}` }}>
                  <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: '600', color: secondaryText }}>
                    Description du vote
                  </h3>
                  <p style={{ color: secondaryText, fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: 0 }}>
                    {proposal.relatedVotes[expandedVote].exposeSommaire || proposal.relatedVotes[expandedVote].objet || 'Aucune description disponible'}
                  </p>
                </div>

                <button
                  onClick={() => setExpandedVote(null)}
                  style={{
                    marginTop: '1.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
