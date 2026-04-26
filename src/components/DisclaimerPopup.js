'use client'

import { useState, useEffect } from 'react'

export default function DisclaimerPopup({ darkMode }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Afficher la popup si c'est la première visite
    const hasSeenDisclaimer = localStorage.getItem('disclaimerSeen')
    if (!hasSeenDisclaimer) {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('disclaimerSeen', 'true')
  }

  if (!isOpen) return null

  const bgColor = darkMode ? '#1f2937' : '#ffffff'
  const textColor = darkMode ? '#f3f4f6' : '#1f2937'
  const borderColor = darkMode ? '#374151' : '#e5e7eb'
  const accentColor = '#ef4444'

  return (
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
        background: bgColor,
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '600px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        border: `2px solid ${accentColor}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '2rem', marginRight: '1rem' }}>⚠️</span>
          <h2 style={{ color: accentColor, fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
            Important - Avis de Neutralité
          </h2>
        </div>

        <div style={{ color: textColor, lineHeight: '1.8', marginBottom: '1.5rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            <strong>Cet outil est conçu pour être neutre et objectif.</strong> Il n'a aucune affiliation politique et n'est destiné à promouvoir ou critiquer aucun parti ou candidat.
          </p>

          <p style={{ marginBottom: '1rem' }}>
            <strong>Je m'oppose catégoriquement à toute appropriation politique</strong> de cet outil. Les analyses fournies sont basées sur des données publiques et une logique algorithmique, sans intention de manipulation ou de biais partisan.
          </p>

          <p style={{ marginBottom: '1rem' }}>
            <strong>Les comparaisons ne sont pas à 100% fiables.</strong> Elles dépendent de:
          </p>
          <ul style={{ marginLeft: '1.5rem', color: textColor }}>
            <li>La qualité et la représentativité des sondages</li>
            <li>L'exactitude du parsing des propositions officielles</li>
            <li>La capacité de l'IA à interpréter correctement les propositions et votes</li>
            <li>Les limites inhérentes à l'analyse sémantique automatisée</li>
          </ul>

          <p style={{ marginTop: '1rem', marginBottom: 0, fontStyle: 'italic', color: textColor }}>
            Utilisez cet outil comme une ressource informative complémentaire, pas comme base unique pour vos décisions politiques.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: accentColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.background = '#dc2626'}
            onMouseLeave={(e) => e.target.style.background = accentColor}
          >
            J'ai compris
          </button>
        </div>

        <p style={{
          fontSize: '0.8rem',
          color: darkMode ? '#9ca3af' : '#6b7280',
          marginTop: '1rem',
          marginBottom: 0,
          textAlign: 'center',
        }}>
          © 2026 Kinoument - Conçu pour être neutre et informatif. Toute ressemblance avec des opinions politiques réelles est purement fortuite.
        </p>
      </div>
    </div>
  )
}
