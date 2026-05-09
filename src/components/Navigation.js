'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PARTIES = [
  { name: 'Renaissance', slug: 'renaissance', group: 'PO800538' },
  { name: 'Les Républicains', slug: 'les-republicains', group: 'PO800508' },
  { name: 'La France Insoumise', slug: 'la-france-insoumise', group: 'PO800490' },
  { name: 'Rassemblement National', slug: 'rassemblement-national', group: 'PO800520' },
  { name: 'Parti Socialiste', slug: 'parti-socialiste', group: 'PO800496' },
  { name: 'EELV', slug: 'europe-ecologie-les-verts', group: 'PO800526' },
  { name: 'Parti Communiste', slug: 'parti-communiste-francais', group: 'PO800502' },
  { name: 'Reconquête', slug: 'reconquete', group: 'PO800532' },
  { name: 'Place Publique', slug: 'place-publique', group: 'PO800496' },
  { name: 'UDR', slug: 'union-des-droites-pour-la-republique', group: 'PO800484' },
]

export default function Navigation({ darkMode, onDarkModeChange, language, onLanguageChange }) {
  const pathname = usePathname()
  const currentSlug = pathname?.includes('/parti/') ? pathname.split('/parti/')[1]?.split('?')[0]?.split('/')[0] : null

  const bgColor = darkMode ? '#1f2937' : '#f3f4f6'
  const textColor = darkMode ? '#f3f4f6' : '#1f2937'
  const borderColor = darkMode ? '#374151' : '#d1d5db'
  const hoverBg = darkMode ? '#374151' : '#e5e7eb'
  const activeBg = '#3b82f6'
  const buttonBg = darkMode ? '#374151' : '#e5e7eb'
  const buttonActiveBg = '#3b82f6'

  return (
    <nav style={{
      background: bgColor,
      borderBottom: `1px solid ${borderColor}`,
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: textColor,
      userSelect: 'none',
    }}>
      <Link href="/">
        <button style={{
          padding: '0.5rem 1rem',
          background: pathname === '/' ? activeBg : hoverBg,
          color: pathname === '/' ? 'white' : textColor,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: pathname === '/' ? '600' : '500',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (pathname !== '/') e.target.style.background = hoverBg
        }}
        onMouseLeave={(e) => {
          if (pathname !== '/') e.target.style.background = 'transparent'
        }}
        >
          Accueil
        </button>
      </Link>

      <div style={{ width: '1px', height: '1.5rem', background: borderColor, margin: '0 0.25rem' }} />

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          flex: 1,
          scrollBehavior: 'smooth',
          paddingRight: '0.5rem',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {PARTIES.map((party) => {
          const isActive = currentSlug === party.slug
          return (
            <Link key={party.slug} href={`/parti/${party.slug}`}>
              <button style={{
                padding: '0.5rem 0.875rem',
                background: isActive ? activeBg : 'transparent',
                color: isActive ? 'white' : textColor,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: isActive ? '600' : '500',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.target.style.background = hoverBg
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.target.style.background = 'transparent'
              }}
              >
                {party.name}
              </button>
            </Link>
          )
        })}
      </div>

      <div style={{ width: '1px', height: '1.5rem', background: borderColor, margin: '0 0.25rem' }} />

      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
        <button onClick={() => onLanguageChange('fr')} disabled={language === 'fr'} style={{
          padding: '0.5rem 0.75rem',
          background: language === 'fr' ? buttonActiveBg : buttonBg,
          color: language === 'fr' ? 'white' : textColor,
          border: 'none',
          borderRadius: '4px',
          cursor: language === 'fr' ? 'default' : 'pointer',
          fontWeight: '500',
          fontSize: '0.85rem',
          transition: 'background 0.2s',
        }}>
          FR
        </button>
        <button onClick={() => onLanguageChange('en')} disabled={language === 'en'} style={{
          padding: '0.5rem 0.75rem',
          background: language === 'en' ? buttonActiveBg : buttonBg,
          color: language === 'en' ? 'white' : textColor,
          border: 'none',
          borderRadius: '4px',
          cursor: language === 'en' ? 'default' : 'pointer',
          fontWeight: '500',
          fontSize: '0.85rem',
          transition: 'background 0.2s',
        }}>
          EN
        </button>
        <button onClick={() => onDarkModeChange(!darkMode)} style={{
          padding: '0.5rem 0.75rem',
          background: buttonBg,
          color: textColor,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
          fontSize: '0.85rem',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.background = hoverBg}
        onMouseLeave={(e) => e.target.style.background = buttonBg}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  )
}
