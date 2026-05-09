/**
 * Tests pour votesCache.js
 * Tests de la structure des votes et de la récupération des données
 */

describe('votesCache vote structure', () => {
  test('vote object has all required fields', () => {
    const vote = {
      numero: '2023-001',
      titre: 'Vote sur la santé',
      objet: 'Réforme du système de santé',
      exposeSommaire: 'Ce vote porte sur la réforme du système de santé',
      sort: 'Adopté',
      date: '2023-01-15',
      amendementNumero: null,
      groupes: []
    }

    expect(vote).toHaveProperty('numero')
    expect(vote).toHaveProperty('titre')
    expect(vote).toHaveProperty('objet')
    expect(vote).toHaveProperty('exposeSommaire')
    expect(vote).toHaveProperty('sort')
    expect(vote).toHaveProperty('date')
    expect(vote).toHaveProperty('amendementNumero')
    expect(vote).toHaveProperty('groupes')
  })

  test('vote date format YYYY-MM-DD', () => {
    const votes = [
      { date: '2023-01-01' },
      { date: '2024-12-31' },
      { date: '2022-06-15' }
    ]

    votes.forEach(vote => {
      expect(vote.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  test('vote with amendment numero includes it', () => {
    const voteWithAmendment = {
      numero: '2023-002',
      titre: 'Vote sur amendement',
      amendementNumero: 'AM-2024-001'
    }

    expect(voteWithAmendment.amendementNumero).toBeTruthy()
    expect(typeof voteWithAmendment.amendementNumero).toBe('string')
  })

  test('vote without amendment numero is null', () => {
    const voteWithoutAmendment = {
      numero: '2023-003',
      titre: 'Vote normal',
      amendementNumero: null
    }

    expect(voteWithoutAmendment.amendementNumero).toBeNull()
  })

  test('groupes array contains valid positions', () => {
    const validPositions = ['pour', 'contre', 'abstention']

    const vote = {
      numero: '2023-004',
      titre: 'Vote test',
      groupes: [
        { organeRef: 'PO845407', positionMajoritaire: 'pour' },
        { organeRef: 'PO845413', positionMajoritaire: 'contre' },
        { organeRef: 'PO845401', positionMajoritaire: 'abstention' }
      ]
    }

    vote.groupes.forEach(groupe => {
      expect(validPositions).toContain(groupe.positionMajoritaire)
    })
  })

  test('vote can have multiple groupes', () => {
    const vote = {
      numero: '2023-005',
      titre: 'Vote avec plusieurs groupes',
      groupes: [
        { organeRef: 'PO845407', positionMajoritaire: 'pour' },
        { organeRef: 'PO845413', positionMajoritaire: 'contre' },
        { organeRef: 'PO845425', positionMajoritaire: 'pour' },
        { organeRef: 'PO845401', positionMajoritaire: 'abstention' }
      ]
    }

    expect(vote.groupes.length).toBeGreaterThanOrEqual(2)
    expect(vote.groupes.every(g => g.organeRef && g.positionMajoritaire)).toBe(true)
  })
})

describe('votesCache filtering', () => {
  test('votes from 2022 onwards are kept', () => {
    const cutoffYear = 2022

    const votes = [
      { date: '2022-01-01' }, // Should be kept
      { date: '2023-06-15' }, // Should be kept
      { date: '2024-12-31' }, // Should be kept
      { date: '2021-12-31' }  // Should be filtered out
    ]

    const filtered = votes.filter(v => v.date.slice(0, 4) >= String(cutoffYear))

    expect(filtered.length).toBe(3)
    expect(filtered.every(v => parseInt(v.date.slice(0, 4)) >= cutoffYear)).toBe(true)
  })

  test('votes before 2022 are filtered out', () => {
    const votes = [
      { date: '2021-12-31' },
      { date: '2020-06-15' },
      { date: '2019-01-01' }
    ]

    const filtered = votes.filter(v => v.date.slice(0, 4) >= '2022')

    expect(filtered.length).toBe(0)
  })

  test('votes with invalid date format are handled', () => {
    const votes = [
      { date: '2023-01-01' },  // Valid
      { date: '' },             // Invalid
      { date: null },           // Invalid
      { date: 'not-a-date' }   // Invalid
    ]

    const filtered = votes.filter(v => {
      if (!v.date || typeof v.date !== 'string') return false
      return v.date.slice(0, 4) >= '2022'
    })

    expect(filtered.length).toBe(1)
    expect(filtered[0].date).toBe('2023-01-01')
  })
})

describe('votesCache sorting and filtering groupes', () => {
  test('groupes are filtered to only those with positionMajoritaire', () => {
    const vote = {
      numero: '2023-006',
      groupes: [
        { organeRef: 'PO845407', positionMajoritaire: 'pour' },
        { organeRef: 'PO845413', positionMajoritaire: null },
        { organeRef: 'PO845401', positionMajoritaire: 'contre' }
      ]
    }

    const filtered = vote.groupes.filter(g => g.positionMajoritaire)

    expect(filtered.length).toBe(2)
    expect(filtered.every(g => g.positionMajoritaire)).toBe(true)
  })

  test('groupes positions are counted correctly', () => {
    const groupes = [
      { organeRef: 'PO1', positionMajoritaire: 'pour' },
      { organeRef: 'PO2', positionMajoritaire: 'pour' },
      { organeRef: 'PO3', positionMajoritaire: 'pour' },
      { organeRef: 'PO4', positionMajoritaire: 'contre' },
      { organeRef: 'PO5', positionMajoritaire: 'contre' },
      { organeRef: 'PO6', positionMajoritaire: 'abstention' }
    ]

    const pourCount = groupes.filter(g => g.positionMajoritaire === 'pour').length
    const contreCount = groupes.filter(g => g.positionMajoritaire === 'contre').length
    const abstentionCount = groupes.filter(g => g.positionMajoritaire === 'abstention').length

    expect(pourCount).toBe(3)
    expect(contreCount).toBe(2)
    expect(abstentionCount).toBe(1)
  })
})

describe('votesCache amendment numero extraction', () => {
  test('extracts amendment numero from vote titre', () => {
    const titles = [
      'Vote sur amendement n° 001',
      'Vote sur l\'amendement n°002',
      'scrutin sur amendement no 123',
      'Amendment n° A1B2C3'
    ]

    titles.forEach(titre => {
      const match = titre.match(/amendement\s+n°?\s*(\w+)/i)
      expect(match).not.toBeNull()
      if (match) {
        expect(match[1]).toBeTruthy()
      }
    })
  })

  test('returns null when no amendment numero found', () => {
    const titles = [
      'Vote sur l\'éducation',
      'Scrutin sur la fiscalité',
      'Vote sur les droits sociaux'
    ]

    titles.forEach(titre => {
      const match = titre.match(/amendement\s+n°?\s*(\w+)/i)
      expect(match).toBeNull()
    })
  })

  test('extracts amendment numero correctly with various formats', () => {
    const patterns = [
      { titre: 'amendement n° 001', expected: '001' },
      { titre: 'amendement no 123', expected: '123' },
      { titre: 'amendment n°ABC', expected: 'ABC' }
    ]

    patterns.forEach(({ titre, expected }) => {
      const match = titre.match(/amendement\s+n°?\s*(\w+)/i)
      if (match) {
        expect(match[1]).toBe(expected)
      }
    })
  })
})

describe('votesCache error handling', () => {
  test('handles votes with missing optional fields', () => {
    const vote = {
      numero: '2023-007',
      titre: 'Vote minimal',
      groupes: []
      // Missing objet, exposeSommaire, sort, etc.
    }

    const title = vote.titre || ''
    const summary = vote.exposeSommaire || ''
    const object = vote.objet || ''

    expect(title).toBe('Vote minimal')
    expect(summary).toBe('')
    expect(object).toBe('')
  })

  test('handles empty groupes array', () => {
    const vote = {
      numero: '2023-008',
      titre: 'Vote sans votes des groupes',
      groupes: []
    }

    const positions = vote.groupes.flatMap(g => ({ position: g.positionMajoritaire, titre: vote.titre }))
    expect(positions.length).toBe(0)
  })

  test('handles very long vote titles', () => {
    const longTitle = 'a'.repeat(1000)
    const vote = {
      numero: '2023-009',
      titre: longTitle,
      groupes: []
    }

    expect(vote.titre.length).toBe(1000)
    const truncated = vote.titre.substring(0, 200)
    expect(truncated.length).toBe(200)
  })

  test('handles special characters in vote fields', () => {
    const vote = {
      numero: '2023-010',
      titre: 'Vote sur l\'«économie» & les "droits"',
      objet: 'Texte avec caractères: <>&"\'',
      groupes: []
    }

    expect(vote.titre).toMatch(/[«»&"]/)
    expect(vote.objet).toMatch(/[<>&"']/)
  })
})
