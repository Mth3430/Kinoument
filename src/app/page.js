'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Navigation from '../components/Navigation'
import PollChart from '../components/PollChart'
import DisclaimerPopup from '../components/DisclaimerPopup'

export default function Home() {
  const [language, setLanguage] = useState('fr')
  const [darkMode, setDarkMode] = useState(true)
  const [partiesStatus, setPartiesStatus] = useState([])
  const [showDisclaimer, setShowDisclaimer] = useState(null)
  const pollingRef = useRef(null)

  const translations = {
    en: {
      title: 'Political Program Comparator',
      subtitle: <>Compare party programs from <a href="https://tous-les-programmes.fr" target="_blank" rel="noopener noreferrer">Tous-Les-Programmes.fr</a> with French National Assembly votes.</>,
      selectParty: 'Select a Political Party',
      viewDetails: 'View Details',
      preloadTitle: 'Pre-analysis in progress',
      preloadDone: 'All analyses ready',
      statusPending: 'Waiting',
      statusLoading: 'Analyzing',
      statusReady: 'Ready',
      statusError: 'Error',
    },
    fr: {
      title: 'Comparateur de Programmes Politiques',
      subtitle: 'Comparez les programmes des partis de <a href="https://tous-les-programmes.fr" target="_blank" rel="noopener noreferrer">Tous-Les-Programmes.fr</a> avec les votes de l\'Assemblée Nationale Française.',
      selectParty: 'Sélectionnez un Parti Politique',
      viewDetails: 'Voir les Détails',
      preloadTitle: 'Pré-analyse en cours',
      preloadDone: 'Toutes les analyses sont prêtes',
      statusPending: 'En attente',
      statusLoading: 'Analyse en cours',
      statusReady: 'Prêt',
      statusError: 'Erreur',
    },
  }

  const t = translations[language]

  const parties = [
    { name: 'Renaissance', slug: 'renaissance', group: 'PO800538', description: language === 'fr' ? 'Renaissance est le parti d\'Emmanuel Macron, axé sur des politiques centristes, l\'intégration européenne et la modernisation économique.' : 'Renaissance is the party of Emmanuel Macron, focusing on centrist policies, European integration, and economic modernization.' },
    { name: 'Rassemblement National', slug: 'rassemblement-national', group: 'PO800520', description: language === 'fr' ? 'Rassemblement National, anciennement Front National, est un parti d\'extrême droite mettant l\'accent sur la souveraineté nationale, le contrôle de l\'immigration et l\'euroscepticisme.' : 'Rassemblement National, formerly National Front, is a far-right party emphasizing national sovereignty, immigration control, and Euroscepticism.' },
    { name: 'La France Insoumise', slug: 'la-france-insoumise', group: 'PO800490', description: language === 'fr' ? 'La France Insoumise est un parti populiste de gauche dirigé par Jean-Luc Mélenchon, promouvant la justice sociale, l\'environnementalisme et l\'anti-capitalisme.' : 'La France Insoumise is a left-wing populist party led by Jean-Luc Mélenchon, promoting social justice, environmentalism, and anti-capitalism.' },
    { name: 'Les Républicains', slug: 'les-republicains', group: 'PO800508', description: language === 'fr' ? 'Les Républicains est un parti de centre-droit défendant les valeurs traditionnelles, le libéralisme économique et une défense nationale forte.' : 'Les Républicains is a center-right party advocating for traditional values, economic liberalism, and strong national defense.' },
    { name: 'Parti Socialiste', slug: 'parti-socialiste', group: 'PO800496', description: language === 'fr' ? 'Parti Socialiste est un parti social-démocrate de centre-gauche engagé pour le bien-être social, les droits des travailleurs et les réformes progressistes.' : 'Parti Socialiste is a center-left social democratic party committed to social welfare, labor rights, and progressive reforms.' },
    { name: 'Europe Écologie Les Verts', slug: 'europe-ecologie-les-verts', group: 'PO800526', description: language === 'fr' ? 'Europe Écologie Les Verts est un parti écologiste dédié à la transition écologique, au développement durable et aux politiques vertes.' : 'Europe Écologie Les Verts is an environmentalist party dedicated to ecological transition, sustainable development, and green policies.' },
    { name: 'Parti Communiste', slug: 'parti-communiste-francais', group: 'PO800502', description: language === 'fr' ? 'Parti Communiste est un parti communiste défendant les droits des travailleurs, l\'anti-impérialisme et la transformation socialiste.' : 'Parti Communiste is a communist party advocating for workers\' rights, anti-imperialism, and socialist transformation.' },
    { name: 'Reconquête', slug: 'reconquete', group: 'PO800532', description: language === 'fr' ? 'Reconquête est un parti de droite populiste dirigé par Éric Zemmour, axé sur la souveraineté nationale et les politiques identitaires.' : 'Reconquête is a right-wing populist party led by Éric Zemmour, focusing on national sovereignty and identity politics.' },
    { name: 'MoDem', slug: 'modem', group: 'PO800484', description: language === 'fr' ? 'MoDem est un parti centriste libéral fondé par François Bayrou, défendant l\'Europe, le libéralisme politique et économique.' : 'MoDem is a centrist liberal party founded by François Bayrou, advocating for Europe, political and economic liberalism.' },
  ]

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/preload-status')
        const data = await res.json()
        setPartiesStatus(data)
        const allDone = data.every((p) => p.status === 'ready' || p.status === 'error')
        if (allDone) clearInterval(pollingRef.current)
      } catch { /* ignore */ }
    }
    poll()
    pollingRef.current = setInterval(poll, 3000)
    return () => clearInterval(pollingRef.current)
  }, [])

  const totalProposals = partiesStatus.reduce((acc, p) => acc + (p.total || 0), 0)
  const doneProposals = partiesStatus.reduce((acc, p) => acc + (p.status === 'ready' ? (p.total || 0) : (p.progress || 0)), 0)
  const readyCount = partiesStatus.filter((p) => p.status === 'ready').length
  const allDone = partiesStatus.length > 0 && partiesStatus.every((p) => p.status === 'ready' || p.status === 'error')
  const anyLoading = partiesStatus.some((p) => p.status === 'loading' || p.status === 'pending')

  const statusColor = (status) => {
    if (status === 'ready') return '#28a745'
    if (status === 'loading') return '#007bff'
    if (status === 'error') return '#dc3545'
    return '#aaa'
  }

  const statusDot = (status) => {
    if (status === 'loading') return '⟳ '
    if (status === 'ready') return '✓ '
    if (status === 'error') return '✗ '
    return '○ '
  }

  const bgColor = darkMode ? '#1f2937' : '#ffffff'
  const textColor = darkMode ? '#f3f4f6' : '#1f2937'
  const cardBg = darkMode ? '#111827' : '#f9fafb'
  const cardBorder = darkMode ? '#374151' : '#e5e7eb'
  const buttonBg = darkMode ? '#374151' : '#e5e7eb'
  const buttonActiveBg = '#3b82f6'
  const secondaryText = darkMode ? '#d1d5db' : '#6b7280'

  return (
    <>
      <DisclaimerPopup darkMode={darkMode} onShowDisclaimer={setShowDisclaimer} />
      <Navigation
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        language={language}
        onLanguageChange={setLanguage}
      />
      <main style={{
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        background: bgColor,
        minHeight: '100vh',
        color: textColor,
        transition: 'background 0.3s, color 0.3s',
      }}>
      <h1 style={{ color: textColor, fontSize: '3rem', fontWeight: '800', marginBottom: '2rem', textAlign: 'left' }}>
        Kinoument
      </h1>
      <PollChart darkMode={darkMode} />

      {partiesStatus.length > 0 && !allDone && (
        <div style={{
          marginBottom: '2rem',
          border: `1px solid ${cardBorder}`,
          borderRadius: '8px',
          padding: '1rem',
          background: cardBg,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong style={{ color: textColor }}>{allDone ? t.preloadDone : t.preloadTitle}</strong>
            <span style={{ fontSize: '0.85em', color: secondaryText }}>
              {readyCount}/{partiesStatus.length} partis — {doneProposals}/{totalProposals || '?'} propositions
            </span>
          </div>

          <div style={{ background: darkMode ? '#374151' : '#e5e7eb', borderRadius: '4px', height: '10px', overflow: 'hidden', marginBottom: '0.75rem' }}>
            <div style={{
              height: '100%',
              width: totalProposals > 0 ? `${Math.round((doneProposals / totalProposals) * 100)}%` : (anyLoading ? '2%' : '0%'),
              background: allDone ? '#10b981' : '#3b82f6',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.3rem' }}>
            {partiesStatus.map((p) => (
              <div key={p.slug} style={{ fontSize: '0.8em', color: statusColor(p.status), display: 'flex', justifyContent: 'space-between' }}>
                <span>{statusDot(p.status)}{p.name}</span>
                {p.status === 'loading' && p.total > 0 && (
                  <span style={{ color: secondaryText }}>{p.progress}/{p.total}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
        {t.selectParty}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {parties.map((party) => {
          const ps = partiesStatus.find((p) => p.slug === party.slug)
          const isReady = ps?.status === 'ready'
          return (
            <div key={party.slug} style={{
              border: `1px solid ${cardBorder}`,
              padding: '1.5rem',
              borderRadius: '8px',
              background: cardBg,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = darkMode ? '#1f2937' : '#f3f4f6'
              e.currentTarget.style.borderColor = darkMode ? '#4b5563' : '#d1d5db'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = cardBg
              e.currentTarget.style.borderColor = cardBorder
            }}
            >
              <h3 style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: textColor,
                fontSize: '1.1rem',
                fontWeight: '600',
                margin: '0 0 0.75rem 0',
              }}>
                {party.name}
                {ps && (
                  <span style={{
                    fontSize: '0.65em',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: statusColor(ps.status),
                    color: 'white',
                    fontWeight: '500',
                  }}>
                    {isReady ? t.statusReady : ps.status === 'loading' ? `${ps.progress}/${ps.total}` : t.statusPending}
                  </span>
                )}
              </h3>
              <p style={{ color: secondaryText, fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                {party.description}
              </p>
              <Link href={`/parti/${party.slug}?lang=${language}`}>
                <button style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                >
                  {t.viewDetails}
                </button>
              </Link>
            </div>
          )
        })}
      </div>

      <section style={{
        marginTop: '4rem',
        padding: '2rem',
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
            Comment ça marche ?
          </h2>
          {showDisclaimer && (
            <button
              onClick={() => showDisclaimer()}
              style={{
                padding: '0.5rem 1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
              }}
              onMouseEnter={(e) => e.target.style.background = '#dc2626'}
              onMouseLeave={(e) => e.target.style.background = '#ef4444'}
            >
              ⚠️ Voir l'avis de neutralité
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          <div>
            <h3 style={{ color: textColor, fontWeight: '600', marginBottom: '0.75rem' }}>
              📊 Sondages Présidentiels
            </h3>
            <p style={{ color: secondaryText, lineHeight: '1.6', margin: 0 }}>
              Le camembert en haut représente une moyenne des sondages de plusieurs instituts de sondage (IFOP, BVA, Elabe, OpinionWay). Cliquez sur un parti pour voir son analyse détaillée.
            </p>
          </div>

          <div>
            <h3 style={{ color: textColor, fontWeight: '600', marginBottom: '0.75rem' }}>
              🗳️ Analyse des Programmes
            </h3>
            <p style={{ color: secondaryText, lineHeight: '1.6', margin: 0 }}>
              Nous scrappons les propositions officielles de chaque parti depuis{' '}
              <a href="https://tous-les-programmes.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                Tous-Les-Programmes.fr
              </a>
              {' '}et les comparons avec les votes du Parlement.
            </p>
          </div>

          <div>
            <h3 style={{ color: textColor, fontWeight: '600', marginBottom: '0.75rem' }}>
              🤖 Intelligence Artificielle
            </h3>
            <p style={{ color: secondaryText, lineHeight: '1.6', margin: 0 }}>
              Nous utilisons l'IA (Ollama/Llama3) pour analyser la cohérence sémantique entre les propositions et les votes du groupe parlementaire.
            </p>
          </div>

          <div>
            <h3 style={{ color: textColor, fontWeight: '600', marginBottom: '0.75rem' }}>
              📈 Votes de l'Assemblée
            </h3>
            <p style={{ color: secondaryText, lineHeight: '1.6', margin: 0 }}>
              Les données de votes proviennent de{' '}
              <a href="https://data.assemblee-nationale.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                l'API officielle de l'Assemblée Nationale
              </a>
              {' '}(données publiques).
            </p>
          </div>

          <div>
            <h3 style={{ color: textColor, fontWeight: '600', marginBottom: '0.75rem' }}>
              ⚡ Mise à Jour
            </h3>
            <p style={{ color: secondaryText, lineHeight: '1.6', margin: 0 }}>
              Les données sont mises à jour automatiquement. Les sondages se rafraîchissent tous les jours, et l'analyse se met à jour en temps réel.
            </p>
          </div>

          <div>
            <h3 style={{ color: textColor, fontWeight: '600', marginBottom: '0.75rem' }}>
              🔗 Sources
            </h3>
            <p style={{ color: secondaryText, lineHeight: '1.6', margin: 0 }}>
              <a href="https://tous-les-programmes.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                Tous-Les-Programmes.fr
              </a>
              {' '} • {' '}
              <a href="https://data.assemblee-nationale.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                Assemblée Nationale
              </a>
            </p>
          </div>
        </div>

        <div style={{
          borderTop: `1px solid ${cardBorder}`,
          paddingTop: '1rem',
          fontSize: '0.85rem',
          color: secondaryText,
          textAlign: 'center',
        }}>
          <p style={{ margin: '0.5rem 0' }}>
            💡 Cet outil est une analyse comparative neutre basée sur des données publiques.
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            Les résultats dépendent de la qualité des sondages et de l'analyse sémantique de l'IA.
          </p>
        </div>
      </section>
    </main>
    </>
  )
}
