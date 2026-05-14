'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

export default function PollChart({ darkMode }) {
  const router = useRouter()
  const [pollData, setPollData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  const bgColor = darkMode ? '#111827' : '#f9fafb'
  const textColor = darkMode ? '#f3f4f6' : '#1f2937'
  const borderColor = darkMode ? '#374151' : '#e5e7eb'
  const secondaryText = darkMode ? '#d1d5db' : '#6b7280'

  useEffect(() => {
    // Détecter si c'est mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/polls')
        if (!res.ok) throw new Error('Failed to fetch polls')
        const data = await res.json()
        setPollData(data)
        setLastUpdate(new Date(data.timestamp))
        setError(null)
      } catch (err) {
        setError(err.message)
        setPollData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPolls()

    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(fetchPolls, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const pollSourceLinks = {
    'IFOP': 'https://www.ifop.com/publication/',
    'BVA': 'https://www.bva-group.com/',
    'Elabe': 'https://www.elabe.fr/',
    'OpinionWay': 'https://www.opinion-way.com/',
  }

  const handlePartyClick = (slug) => {
    router.push(`/parti/${slug}`)
  }

  const openPollSource = (sourceName) => {
    const url = pollSourceLinks[sourceName]
    if (url) {
      window.open(url, '_blank')
    }
  }

  if (loading) {
    return (
      <div style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
        textAlign: 'center',
        color: secondaryText,
      }}>
        <p>Chargement des sondages...</p>
      </div>
    )
  }

  if (error || !pollData) {
    return (
      <div style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
        textAlign: 'center',
        color: '#ef4444',
      }}>
        <p>Erreur: {error || 'Impossible de charger les sondages'}</p>
      </div>
    )
  }

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: '8px',
      padding: isMobile ? '1rem' : '1.5rem',
      marginBottom: isMobile ? '1.5rem' : '2rem',
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: textColor, fontSize: '1.3rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
          Sondages Présidentiels 2027
        </h2>
        <p style={{ color: secondaryText, fontSize: '0.9rem', margin: 0 }}>
          Moyenne de {pollData.sources.length} sources
          {lastUpdate && ` • Mis à jour ${lastUpdate.toLocaleTimeString('fr-FR')}`}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
          <PieChart>
            <Pie
              data={pollData.data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={isMobile ? false : ({ name, value }) => `${name} ${value}%`}
              outerRadius={isMobile ? 45 : 80}
              fill="#8884d8"
              dataKey="value"
              onClick={(_, index) => handlePartyClick(pollData.data[index].slug)}
              style={{ cursor: 'pointer' }}
              isAnimationActive={false}
            >
              {pollData.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{
                background: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                color: textColor,
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '1rem',
                color: textColor,
              }}
              formatter={(value, entry) => `${entry.payload.name} (${entry.payload.value}%)`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 'clamp(0.5rem, 2vw, 0.75rem)',
        fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
        color: secondaryText,
        borderTop: `1px solid ${borderColor}`,
        paddingTop: '1rem',
        marginTop: '1rem',
      }}>
        {pollData.sources.map((source, idx) => (
          <div key={idx} style={{ textAlign: 'center' }}>
            <button
              onClick={() => openPollSource(source.name)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontWeight: '500',
                color: '#3b82f6',
                fontSize: 'inherit',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.color = '#60a5fa'}
              onMouseLeave={(e) => e.target.style.color = '#3b82f6'}
            >
              {source.name}
            </button>
            <br />
            <span style={{ fontSize: '0.8rem' }}>{new Date(source.date).toLocaleDateString('fr-FR')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
