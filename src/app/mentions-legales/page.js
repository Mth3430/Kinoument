'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navigation from '../../components/Navigation'

export default function MentionsLegales() {
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState('fr')

  const translations = {
    en: {
      title: 'Legal Notices',
      back: 'Back to Home',
    },
    fr: {
      title: 'Mentions Légales',
      back: 'Retour à l\'Accueil',
    },
  }

  const t = translations[language]

  const bgColor = darkMode ? '#1f2937' : '#ffffff'
  const textColor = darkMode ? '#f3f4f6' : '#1f2937'
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
        <Link href="/" style={{ textDecoration: 'none' }}>
          <button style={{
            marginBottom: '2rem',
            padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem)',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: 'clamp(0.85rem, 2vw, 0.9rem)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.background = '#2563eb'}
          onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
          >
            ← {t.back}
          </button>
        </Link>

        <div style={{ maxWidth: '800px' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 8vw, 2.5rem)', fontWeight: '700', marginBottom: 'clamp(1.5rem, 4vw, 2rem)', color: textColor }}>
            {t.title}
          </h1>

          <div style={{ color: secondaryText, lineHeight: '1.8', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
            <p><strong>Kinoument</strong> est une application web qui compare les promesses électorales des partis politiques français avec leurs votes réels au Parlement.</p>

            <h2 style={{ color: textColor, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: '600', marginTop: '2rem', marginBottom: '0.5rem' }}>Directeur de la publication</h2>
            <p>Mathieu Pernot<br />Contact: info@kinoument.fr</p>

            <h2 style={{ color: textColor, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: '600', marginTop: '2rem', marginBottom: '0.5rem' }}>Sources de données</h2>
            <p>Les données de votes proviennent de l'<a href="https://data.assemblee-nationale.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>API officielle de l'Assemblée Nationale Française</a>. Les données des programmes politiques proviennent de <a href="https://tous-les-programmes.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Tous-Les-Programmes.fr</a>. Toutes les sources de données sont du domaine public.</p>

            <h2 style={{ color: textColor, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: '600', marginTop: '2rem', marginBottom: '0.5rem' }}>Avertissement</h2>
            <p>Cette application est fournie à titre informatif. Les résultats d'analyse dépendent de la qualité des sources de données et de l'algorithme de correspondance. Les utilisateurs sont encouragés à consulter les sources officielles pour des informations complètes et fiables.</p>

            <h2 style={{ color: textColor, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: '600', marginTop: '2rem', marginBottom: '0.5rem' }}>Propriété Intellectuelle</h2>
            <p>© 2026 Kinoument. Tous droits réservés. Licencié sous la licence MIT.</p>

            <h2 style={{ color: textColor, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: '600', marginTop: '2rem', marginBottom: '0.5rem' }}>Limitation de Responsabilité</h2>
            <p>Kinoument ne peut être tenu responsable de tout dommage direct, indirect, accidentel, spécial ou consécutif découlant de l'utilisation ou de l'incapacité à utiliser cette application.</p>
          </div>
        </div>
      </main>
    </>
  )
}
