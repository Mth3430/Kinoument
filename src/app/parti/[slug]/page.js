'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '../../../components/Navigation'

export default function PartyPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params.slug
  const [party, setParty] = useState(null)
  const [comparisons, setComparisons] = useState([])
  const [loadStatus, setLoadStatus] = useState({ status: 'pending', progress: 0, total: 0 })
  const [error, setError] = useState('')
  const [language, setLanguage] = useState(searchParams.get('lang') || 'fr')
  const [darkMode, setDarkMode] = useState(true)
  const [displayedCount, setDisplayedCount] = useState(30)
  const [selectedThemes, setSelectedThemes] = useState([])
  const [selectedStatus, setSelectedStatus] = useState([])
  const pollingRef = useRef(null)
  const sentinelRef = useRef(null)

  const translations = {
    en: {
      back: 'Back to Home',
      comparativeAnalysis: 'Comparative Analysis',
      respected: 'Respected',
      notRespected: 'Not Respected',
      mitigated: 'Mitigated',
      unknown: 'Unknown',
      loading: 'Loading data...',
      analyzing: 'Analysis in progress',
      partyNotFound: 'Party not found',
      noRelatedVotes: 'No related votes found.',
      aiLabel: 'AI',
      keywordLabel: 'Keywords',
    },
    fr: {
      back: 'Retour à l\'Accueil',
      comparativeAnalysis: 'Analyse Comparative',
      respected: 'Respecté',
      notRespected: 'Non Respecté',
      mitigated: 'Mitigé',
      unknown: 'Inconnu',
      loading: 'Chargement des données...',
      analyzing: 'Analyse en cours',
      partyNotFound: 'Parti non trouvé',
      noRelatedVotes: 'Aucun vote lié trouvé.',
      aiLabel: 'IA',
      keywordLabel: 'Mots-clés',
    },
  }

  const t = translations[language]

  // Extraire tous les thèmes uniques
  const allThemes = Array.from(
    new Set(comparisons.flatMap(c => c.proposal?.themes?.map(t => t.name) || []))
  ).sort()

  // Filtrer les comparisons basé sur les thèmes et status sélectionnés
  const filteredComparisons = comparisons.filter(c => {
    const hasTheme = selectedThemes.length === 0 || c.proposal?.themes?.some(t => selectedThemes.includes(t.name))
    const hasStatus = selectedStatus.length === 0 || selectedStatus.includes(c.status)
    return hasTheme && hasStatus
  })

  const toggleTheme = (theme) => {
    setSelectedThemes(prev =>
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    )
  }

  const toggleStatus = (status) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  // Calculer les pourcentages des statuts
  const totalComparisons = comparisons.length
  const statusStats = {
    respected: comparisons.filter(c => c.status === 'respected').length,
    notRespected: comparisons.filter(c => c.status === 'notRespected').length,
    mitigated: comparisons.filter(c => c.status === 'mitigated').length,
    unknown: comparisons.filter(c => c.status === 'unknown').length,
  }
  const statusPercentages = {
    respected: totalComparisons > 0 ? Math.round((statusStats.respected / totalComparisons) * 100) : 0,
    notRespected: totalComparisons > 0 ? Math.round((statusStats.notRespected / totalComparisons) * 100) : 0,
    mitigated: totalComparisons > 0 ? Math.round((statusStats.mitigated / totalComparisons) * 100) : 0,
    unknown: totalComparisons > 0 ? Math.round((statusStats.unknown / totalComparisons) * 100) : 0,
  }

  const parties = [
    { name: 'Renaissance', slug: 'renaissance', group: 'PO800538' },
    { name: 'Rassemblement National', slug: 'rassemblement-national', group: 'PO800520' },
    { name: 'La France Insoumise', slug: 'la-france-insoumise', group: 'PO800490' },
    { name: 'Les Républicains', slug: 'les-republicains', group: 'PO800508' },
    { name: 'Socialistes et apparentés', slug: 'parti-socialiste', group: 'PO800496' },
    { name: 'Europe Écologie Les Verts', slug: 'europe-ecologie-les-verts', group: 'PO800526' },
    { name: 'Parti Communiste', slug: 'parti-communiste-francais', group: 'PO800502' },
    { name: 'Reconquête', slug: 'reconquete', group: 'PO800532' },
  ]

  useEffect(() => {
    const foundParty = parties.find((p) => p.slug === slug)
    if (foundParty) {
      setParty(foundParty)
    } else {
      setError(t.partyNotFound)
    }
  }, [slug])

  useEffect(() => {
    if (!party) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/comparisons?slug=${party.slug}`)
        const data = await res.json()
        setComparisons(data.comparisons || [])
        setLoadStatus({ status: data.status, progress: data.progress ?? 0, total: data.total ?? 0 })
        if (data.status === 'ready' || data.status === 'error') {
          clearInterval(pollingRef.current)
        }
      } catch { /* ignore */ }
    }

    poll()
    pollingRef.current = setInterval(poll, 3000)
    return () => clearInterval(pollingRef.current)
  }, [party])

  // Lazy loading: charge plus de propositions quand on atteint le bas
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && displayedCount < comparisons.length) {
          setDisplayedCount(prev => Math.min(prev + 30, comparisons.length))
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [displayedCount, comparisons.length])

  const statusColor = (status) => {
    if (status === 'respected') return '#d4edda'
    if (status === 'notRespected') return '#f8d7da'
    if (status === 'mitigated') return '#fff3cd'
    return '#f8f9fa'
  }
  const getStatusColor = (status) => {
    if (status === 'respected') return 'green'
    if (status === 'notRespected') return 'red'
    if (status === 'mitigated') return '#e67e00'
    return 'gray'
  }
  const statusLabel = (status) => {
    if (status === 'respected') return t.respected
    if (status === 'notRespected') return t.notRespected
    if (status === 'mitigated') return t.mitigated
    return t.unknown
  }

  if (!party) return <main style={{ padding: '2rem' }}><p>{t.loading}</p></main>

  const isLoading = loadStatus.status === 'pending' || loadStatus.status === 'loading'

  const bgColor = darkMode ? '#1f2937' : '#ffffff'
  const textColor = darkMode ? '#f3f4f6' : '#1f2937'
  const cardBg = darkMode ? '#111827' : '#f9fafb'
  const cardBorder = darkMode ? '#374151' : '#e5e7eb'
  const buttonBg = darkMode ? '#374151' : '#e5e7eb'
  const buttonActiveBg = '#3b82f6'
  const secondaryText = darkMode ? '#d1d5db' : '#6b7280'

  return (
    <>
      <Navigation
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        language={language}
        onLanguageChange={setLanguage}
      />
      <main style={{
        padding: 'clamp(1rem, 5vw, 2rem)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        background: bgColor,
        minHeight: '100vh',
        color: textColor,
        transition: 'background 0.3s, color 0.3s',
      }}>

      <h1 style={{
        fontSize: 'clamp(1.75rem, 8vw, 2.5rem)',
        fontWeight: '700',
        margin: 'clamp(1rem, 4vw, 2rem) 0 0.5rem 0',
        color: textColor,
      }}>{party.name}</h1>
      <p style={{ color: secondaryText, marginBottom: 'clamp(1rem, 4vw, 2rem)', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
        Analyse comparative avec les votes de l'Assemblée Nationale
      </p>

      {comparisons.length > 0 && (
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
          <div style={{
            display: 'flex',
            height: '30px',
            borderRadius: '6px',
            overflow: 'hidden',
            background: '#f0f0f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            group: 'stats-bar'
          }}>
            {statusPercentages.respected > 0 && (
              <div
                style={{
                  width: `${statusPercentages.respected}%`,
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                title={`Respecté: ${statusPercentages.respected}%`}
              />
            )}
            {statusPercentages.mitigated > 0 && (
              <div
                style={{
                  width: `${statusPercentages.mitigated}%`,
                  background: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                title={`Mitigé: ${statusPercentages.mitigated}%`}
              />
            )}
            {statusPercentages.notRespected > 0 && (
              <div
                style={{
                  width: `${statusPercentages.notRespected}%`,
                  background: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                title={`Non respecté: ${statusPercentages.notRespected}%`}
              />
            )}
            {statusPercentages.unknown > 0 && (
              <div
                style={{
                  width: `${statusPercentages.unknown}%`,
                  background: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                title={`Inconnu: ${statusPercentages.unknown}%`}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem', color: secondaryText }}>
            <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#10b981', borderRadius: '2px', marginRight: '0.5rem' }}></span>Respecté: {statusPercentages.respected}%</span>
            <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px', marginRight: '0.5rem' }}></span>Mitigé: {statusPercentages.mitigated}%</span>
            <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px', marginRight: '0.5rem' }}></span>Non respecté: {statusPercentages.notRespected}%</span>
            <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#9ca3af', borderRadius: '2px', marginRight: '0.5rem' }}></span>Inconnu: {statusPercentages.unknown}%</span>
          </div>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {isLoading && (
        <p style={{ color: '#666' }}>
          {t.analyzing}
          {loadStatus.total > 0 ? `… (${loadStatus.progress}/${loadStatus.total})` : '…'}
        </p>
      )}

      {comparisons.length > 0 && (
        <section>
          {/* Filtres */}
          <div style={{ marginBottom: '2rem' }}>
            {/* Filtre par status */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', color: secondaryText, marginBottom: '0.75rem' }}>
                Filtrer par statut:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { status: 'respected', label: t.respected, color: '#10b981' },
                  { status: 'mitigated', label: t.mitigated, color: '#f59e0b' },
                  { status: 'notRespected', label: t.notRespected, color: '#ef4444' }
                ].map(({ status, label, color }) => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      border: selectedStatus.includes(status) ? `2px solid ${color}` : `1px solid ${cardBorder}`,
                      background: selectedStatus.includes(status) ? color : 'transparent',
                      color: selectedStatus.includes(status) ? 'white' : textColor,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedStatus.includes(status)) {
                        e.target.style.background = darkMode ? '#374151' : '#e5e7eb'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedStatus.includes(status)) {
                        e.target.style.background = 'transparent'
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtre par thèmes */}
            {allThemes.length > 0 && (
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: secondaryText, marginBottom: '0.75rem' }}>
                  Filtrer par thèmes:
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {allThemes.map(theme => (
                    <button
                      key={theme}
                      onClick={() => toggleTheme(theme)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        border: selectedThemes.includes(theme) ? '2px solid #3b82f6' : `1px solid ${cardBorder}`,
                        background: selectedThemes.includes(theme) ? '#3b82f6' : 'transparent',
                        color: selectedThemes.includes(theme) ? 'white' : textColor,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedThemes.includes(theme)) {
                          e.target.style.background = darkMode ? '#374151' : '#e5e7eb'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedThemes.includes(theme)) {
                          e.target.style.background = 'transparent'
                        }
                      }}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <h2 style={{ color: textColor, fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', fontWeight: '600', marginBottom: 'clamp(1rem, 4vw, 1.5rem)' }}>
            {t.comparativeAnalysis} ({filteredComparisons.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 90vw, 340px), 1fr))', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
            {filteredComparisons.slice(0, displayedCount).map((item) => {
              const actualIndex = comparisons.findIndex(c => c === item)
              return (
              <div
                key={actualIndex}
                onClick={() => router.push(`/parti/${slug}/proposal/${actualIndex}`)}

                style={{
                  background: cardBg,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: `1.5px solid ${
                    item.status === 'respected' ? '#10b981' :
                    item.status === 'notRespected' ? '#ef4444' :
                    item.status === 'mitigated' ? '#f59e0b' : cardBorder
                  }`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = darkMode ? '0 10px 25px rgba(0, 0, 0, 0.15)' : '0 10px 25px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
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
                      background: item.status === 'respected' ? '#10b981' :
                        item.status === 'notRespected' ? '#ef4444' :
                        item.status === 'mitigated' ? '#f59e0b' : '#9ca3af',
                    }}>
                      {statusLabel(item.status).toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: secondaryText, fontWeight: '500' }}>
                      {item.relatedVotesCount ?? 0} votes liés
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    color: textColor,
                    margin: 0,
                    lineHeight: '1.4',
                    maxHeight: '2.8em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {item.title || item.proposal?.title}
                  </h3>

                  {/* Description */}
                  {item.description && (
                    <p style={{
                      fontSize: '0.875rem',
                      color: secondaryText,
                      margin: 0,
                      lineHeight: '1.5',
                      maxHeight: '3.5em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {item.description}
                    </p>
                  )}

                  {/* Themes */}
                  {item.proposal?.themes && item.proposal.themes.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {item.proposal.themes.slice(0, 3).map((theme, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            paddingTop: '0.25rem',
                            paddingBottom: '0.25rem',
                            paddingLeft: '0.5rem',
                            paddingRight: '0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            color: 'white',
                            background: theme.color || '#6B7280',
                          }}
                        >
                          {theme.name}
                        </span>
                      ))}
                      {item.proposal?.themes && item.proposal.themes.length > 3 && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          paddingTop: '0.25rem',
                          paddingBottom: '0.25rem',
                          paddingLeft: '0.5rem',
                          paddingRight: '0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.7rem',
                          fontWeight: '500',
                          background: '#e5e7eb',
                          color: '#4b5563',
                        }}>
                          +{item.proposal.themes.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer with AI badge */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      background: item.usedOllama ? '#dbeafe' : '#f3f4f6',
                      color: item.usedOllama ? '#0284c7' : '#6b7280',
                      fontWeight: '500',
                    }}>
                      {item.usedOllama ? '🤖 IA' : '🔑 Mots-clés'}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    fontWeight: '500',
                  }}>
                    Voir plus →
                  </span>
                </div>
              </div>
            )})
            }
          </div>
          <div ref={sentinelRef} style={{ height: '2rem', marginTop: '2rem' }} />
        </section>
      )}
    </main>
    </>
  )
}
