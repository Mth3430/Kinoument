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
      website: 'Website',
      editor: 'Editor in Chief',
      host: 'Host',
      contact: 'Contact',
      responsible: 'Person Responsible',
      description: 'Kinoument is a web application that compares the electoral promises of French political parties with their actual votes in Parliament.',
      hosting: 'Hosting',
      intellectual: 'Intellectual Property',
      limitations: 'Limitation of Liability',
      disclaimer: 'Disclaimer',
      disclaimerText: 'This application is for informational purposes only. The analysis results depend on the quality of the data sources and the matching algorithm. Users are encouraged to consult official sources for complete and authoritative information.',
      sources: 'Data Sources',
      sourcesText: 'Vote data comes from the official API of the French National Assembly (data.assemblee-nationale.fr). Political program data comes from Tous-Les-Programmes.fr. All data sources are public domain.',
      rights: 'All Rights Reserved',
      modification: 'Modification of Content',
      modificationText: 'Kinoument reserves the right to modify the content of this site at any time without notice.',
      liability: 'Limitation of Liability',
      liabilityText: 'Kinoument shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use or inability to use this application.',
    },
    fr: {
      title: 'Mentions Légales',
      back: 'Retour à l\'Accueil',
      website: 'Site web',
      editor: 'Directeur de la publication',
      host: 'Hébergement',
      contact: 'Contact',
      responsible: 'Personne Responsable',
      description: 'Kinoument est une application web qui compare les promesses électorales des partis politiques français avec leurs votes réels au Parlement.',
      hosting: 'Hébergement',
      intellectual: 'Propriété Intellectuelle',
      limitations: 'Limitation de Responsabilité',
      disclaimer: 'Avertissement',
      disclaimerText: 'Cette application est fournie à titre informatif. Les résultats d\'analyse dépendent de la qualité des sources de données et de l\'algorithme de correspondance. Les utilisateurs sont encouragés à consulter les sources officielles pour des informations complètes et fiables.',
      sources: 'Sources de Données',
      sourcesText: 'Les données de votes proviennent de l\'API officielle de l\'Assemblée Nationale Française (data.assemblee-nationale.fr). Les données des programmes politiques proviennent de Tous-Les-Programmes.fr. Toutes les sources de données sont du domaine public.',
      rights: 'Tous droits réservés',
      modification: 'Modification du Contenu',
      modificationText: 'Kinoument se réserve le droit de modifier le contenu de ce site à tout moment sans préavis.',
      liability: 'Limitation de Responsabilité',
      liabilityText: 'Kinoument ne peut être tenu responsable de tout dommage direct, indirect, accidentel, spécial ou consécutif découlant de l\'utilisation ou de l\'incapacité à utiliser cette application.',
    },
  }

  const t = translations[language]

  const bgColor = darkMode ? '#1f2937' : '#ffffff'
  const textColor = darkMode ? '#f3f4f6' : '#1f2937'
  const cardBg = darkMode ? '#111827' : '#f9fafb'
  const cardBorder = darkMode ? '#374151' : '#e5e7eb'
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
            ← {t.back}
          </button>
        </Link>

        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '2rem', color: textColor }}>
          {t.title}
        </h1>

        <div style={{ maxWidth: '900px' }}>
          <section style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: '600', marginTop: 0 }}>
              {t.website}
            </h2>
            <p style={{ color: secondaryText, lineHeight: '1.6' }}>
              <strong>Kinoument</strong><br />
              {t.description}
            </p>
          </section>

          <section style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: '600', marginTop: 0 }}>
              {t.editor}
            </h2>
            <p style={{ color: secondaryText, lineHeight: '1.6' }}>
              <strong>Mathieu Pernot</strong><br />
              {t.contact}: math.pernot30@gmail.com
            </p>
          </section>

          <section style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: '600', marginTop: 0 }}>
              {t.hosting}
            </h2>
            <p style={{ color: secondaryText, lineHeight: '1.6' }}>
              Built with Next.js 14 and hosted on standard web infrastructure.
            </p>
          </section>

          <section style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: '600', marginTop: 0 }}>
              {t.sources}
            </h2>
            <p style={{ color: secondaryText, lineHeight: '1.6' }}>
              {t.sourcesText}
            </p>
            <ul style={{ color: secondaryText, lineHeight: '1.8' }}>
              <li><a href="https://data.assemblee-nationale.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>data.assemblee-nationale.fr</a> - French National Assembly Open Data</li>
              <li><a href="https://tous-les-programmes.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Tous-Les-Programmes.fr</a> - Political Programs Database</li>
            </ul>
          </section>

          <section style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: '600', marginTop: 0 }}>
              {t.disclaimer}
            </h2>
            <p style={{ color: secondaryText, lineHeight: '1.6' }}>
              {t.disclaimerText}
            </p>
          </section>

          <section style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: '600', marginTop: 0 }}>
              {t.intellectual}
            </h2>
            <p style={{ color: secondaryText, lineHeight: '1.6' }}>
              © 2024-2025 Kinoument. {t.rights}. Licensed under MIT License.
            </p>
          </section>

          <section style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem',
          }}>
            <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: '600', marginTop: 0 }}>
              {t.modification}
            </h2>
            <p style={{ color: secondaryText, lineHeight: '1.6' }}>
              {t.modificationText}
            </p>
          </section>

          <section style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '2rem',
          }}>
            <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: '600', marginTop: 0 }}>
              {t.liability}
            </h2>
            <p style={{ color: secondaryText, lineHeight: '1.6' }}>
              {t.liabilityText}
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
