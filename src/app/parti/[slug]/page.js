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

  // Filtrer les comparisons basé sur les thèmes sélectionnés
  const filteredComparisons = selectedThemes.length === 0
    ? comparisons
    : comparisons.filter(c => {
        const hasTheme = c.proposal?.themes?.some(t => selectedThemes.includes(t.name))
        return hasTheme
      })

  const toggleTheme = (theme) => {
    setSelectedThemes(prev =>
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    )
  }

  const parties = [
    { name: 'Renaissance', slug: 'renaissance', group: 'PO800538' },
    { name: 'Les Républicains', slug: 'les-republicains', group: 'PO800508' },
    { name: 'La France Insoumise', slug: 'la-france-insoumise', group: 'PO800490' },
    { name: 'Rassemblement National', slug: 'rassemblement-national', group: 'PO800520' },
    { name: 'Parti Socialiste', slug: 'parti-socialiste', group: 'PO800496' },
    { name: 'Europe Écologie Les Verts', slug: 'europe-ecologie-les-verts', group: 'PO800526' },
    { name: 'Parti Communiste Français', slug: 'parti-communiste-francais', group: 'PO800502' },
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
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        background: bgColor,
        minHeight: '100vh',
        color: textColor,
        transition: 'background 0.3s, color 0.3s',
      }}>

      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: '700',
        margin: '2rem 0 0.5rem 0',
        color: textColor,
      }}>{party.name}</h1>
      <p style={{ color: secondaryText, marginBottom: '2rem', fontSize: '1rem' }}>
        Analyse comparative avec les votes de l'Assemblée Nationale
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {isLoading && (
        <p style={{ color: '#666' }}>
          {t.analyzing}
          {loadStatus.total > 0 ? `… (${loadStatus.progress}/${loadStatus.total})` : '…'}
        </p>
      )}

      {comparisons.length > 0 && (
        <section>
          {allThemes.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
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

          <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            {t.comparativeAnalysis} ({displayedCount}/{filteredComparisons.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {filteredComparisons.slice(0, displayedCount).map((item, index) => (
              <div
                key={index}
                onClick={() => router.push(`/parti/${slug}/proposal/${index}`)}

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
            ))}
          </div>
          <div ref={sentinelRef} style={{ height: '2rem', marginTop: '2rem' }} />
        </section>
      )}
    </main>
    </>
  )
}
