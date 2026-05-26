'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navigation from '../../components/Navigation'

export default function AboutPage() {
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState('fr')

  const translations = {
    en: {
      title: 'About Kinoument',
      back: 'Back to Home',
      version: 'Version',
      lastUpdate: 'Last Updated',
      disclaimer: 'Disclaimer',
      mission: 'Mission',
      missionText: 'Kinoument is a civic tech tool designed to promote transparency in political discourse. We compare electoral promises of French political parties with their actual parliamentary votes, helping citizens make informed decisions.',
      technology: 'Technology',
      technologyText: 'Built with Next.js 14, powered by open data from the French National Assembly and powered by Ollama/Mistral for semantic analysis.',
      privacy: 'Privacy',
      privacyText: 'We do not collect personal data. All analysis is performed locally or on your device. No cookies or tracking.',
    },
    fr: {
      title: 'À Propos de Kinoument',
      back: 'Retour à l\'Accueil',
      version: 'Version',
      lastUpdate: 'Dernière mise à jour',
      disclaimer: 'Avertissement',
      mission: 'Mission',
      missionText: 'Kinoument est un outil de transparence politique conçu pour promouvoir l\'honnêteté dans le discours politique. Nous comparons les promesses électorales des partis politiques français avec leurs votes réels au Parlement, aidant les citoyens à prendre des décisions éclairées.',
      technology: 'Technologie',
      technologyText: 'Construit avec Next.js 14, alimenté par les données ouvertes de l\'Assemblée Nationale Française et par Ollama/Mistral pour l\'analyse sémantique.',
      privacy: 'Confidentialité',
      privacyText: 'Nous ne collectons pas de données personnelles. Toute analyse est effectuée localement ou sur votre appareil. Aucun cookie ni suivi.',
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

          {/* Metadata */}
          <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            marginBottom: '2rem',
            fontSize: 'clamp(0.9rem, 2vw, 1rem)',
            color: secondaryText,
          }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>{t.version}:</strong> 1.2.2
            </div>
            <div>
              <strong>{t.lastUpdate}:</strong> 22 mai 2026
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            background: darkMode ? '#5a1a1a' : '#fef2f2',
            border: `2px solid #ef4444`,
            borderRadius: '8px',
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            marginBottom: '2rem',
          }}>
            <h2 style={{ color: '#ef4444', fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: '600', marginTop: 0, marginBottom: '0.75rem' }}>
              ⚠️ {t.disclaimer}
            </h2>
            <div style={{ color: secondaryText, lineHeight: '1.8', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <p style={{ marginBottom: '1rem' }}>
                <strong>Cet outil est conçu pour être neutre et objectif.</strong> Il n'a aucune affiliation politique et n'est destiné à promouvoir ou critiquer aucun parti ou candidat.
              </p>

              <p style={{ marginBottom: '1rem' }}>
                <strong>Je m'oppose catégoriquement à toute appropriation politique</strong> de cet outil. Les analyses fournies sont basées sur des données publiques et une logique algorithmique, sans intention de manipulation ou de biais partisan.
              </p>

              <p style={{ marginBottom: '1rem' }}>
                <strong>Les comparaisons ne sont pas à 100% fiables.</strong> Elles dépendent de:
              </p>
              <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', color: secondaryText }}>
                <li>La qualité et la représentativité des sondages</li>
                <li>L'exactitude du parsing des propositions officielles</li>
                <li>La capacité de l'IA à interpréter correctement les propositions et votes</li>
                <li>Les limites inhérentes à l'analyse sémantique automatisée</li>
              </ul>

              <p style={{ marginBottom: 0, fontStyle: 'italic' }}>
                Utilisez cet outil comme une ressource informative complémentaire, pas comme base unique pour vos décisions politiques.
              </p>
            </div>
          </div>

          {/* Mission */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: textColor, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: '600', marginBottom: '1rem' }}>
              🎯 {t.mission}
            </h2>
            <p style={{ color: secondaryText, lineHeight: '1.8', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              {t.missionText}
            </p>
          </div>

          {/* Technology */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: textColor, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: '600', marginBottom: '1rem' }}>
              ⚙️ {t.technology}
            </h2>
            <p style={{ color: secondaryText, lineHeight: '1.8', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              {t.technologyText}
            </p>
          </div>

          {/* Privacy */}
          <div>
            <h2 style={{ color: textColor, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', fontWeight: '600', marginBottom: '1rem' }}>
              🔒 {t.privacy}
            </h2>
            <p style={{ color: secondaryText, lineHeight: '1.8', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              {t.privacyText}
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
