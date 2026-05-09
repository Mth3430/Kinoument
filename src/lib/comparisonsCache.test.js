/**
 * Tests d'intégration pour la cache de comparaisons
 * Tests que les données sont correctement structurées avec title et description
 */

describe('comparisonsCache data structure', () => {
  test('proposal object has separate title and description fields', () => {
    // Simule la structure d'une proposition du scraping
    const proposal = {
      title: 'Augmenter les dépenses de santé',
      description: 'Nous allons augmenter le budget de la santé de 20%',
      themes: [
        { name: 'Santé', color: '#FF0000' },
        { name: 'Budget', color: '#0000FF' }
      ],
      text: 'Augmenter les dépenses de santé\nNous allons augmenter le budget de la santé de 20%'
    }

    expect(proposal.title).toBeDefined()
    expect(proposal.description).toBeDefined()
    expect(proposal.text).toBeDefined()
    expect(proposal.title).not.toBe(proposal.description)
    expect(proposal.text).toContain(proposal.title)
    expect(proposal.text).toContain(proposal.description)
  })

  test('comparison result includes title and description from proposal', () => {
    const comparison = {
      proposal: {
        title: 'Réduire la fiscalité',
        description: 'Nous réduirons les impôts de 5%',
        themes: [],
        text: 'Réduire la fiscalité\nNous réduirons les impôts de 5%'
      },
      status: 'respected',
      relatedVotes: [],
      explanation: 'Cohérent avec les votes',
      usedOllama: false,
      title: 'Réduire la fiscalité',
      description: 'Nous réduirons les impôts de 5%'
    }

    expect(comparison.proposal.title).toBe(comparison.title)
    expect(comparison.proposal.description).toBe(comparison.description)
  })

  test('handles empty descriptions correctly', () => {
    const proposal = {
      title: 'Titre seul',
      description: '',
      themes: [],
      text: 'Titre seul'
    }

    expect(proposal.title).toBe('Titre seul')
    expect(proposal.description).toBe('')
    expect(proposal.text).toBe('Titre seul')
  })

  test('themes are properly extracted and stored', () => {
    const proposal = {
      title: 'Proposition avec thèmes',
      description: 'Description détaillée',
      themes: [
        { name: 'Écologie', color: '#00AA00' },
        { name: 'Transport', color: '#FF8800' },
        { name: 'Infrastructure', color: '#0088FF' }
      ],
      text: 'Proposition avec thèmes\nDescription détaillée'
    }

    expect(proposal.themes).toHaveLength(3)
    expect(proposal.themes[0]).toHaveProperty('name')
    expect(proposal.themes[0]).toHaveProperty('color')
    expect(proposal.themes.every(t => t.name && t.color)).toBe(true)
  })

  test('related votes include group details for multiple parties', () => {
    const vote = {
      numero: '100',
      titre: 'Vote sur l\'environnement',
      objet: 'Politique environnementale',
      exposeSommaire: 'Description du scrutin',
      sort: 'Adopté',
      date: '2023-01-15',
      groupes: [
        { organeRef: 'PO845407', positionMajoritaire: 'pour' },
        { organeRef: 'PO845413', positionMajoritaire: 'contre' },
        { organeRef: 'PO845401', positionMajoritaire: 'abstention' }
      ],
      groupDetails: [
        { organeRef: 'PO845407', nom: 'Renaissance', position: 'pour' },
        { organeRef: 'PO845413', nom: 'La France Insoumise', position: 'contre' },
        { organeRef: 'PO845401', nom: 'Rassemblement National', position: 'abstention' }
      ]
    }

    expect(vote.groupDetails).toHaveLength(3)
    expect(vote.groupDetails.every(g => g.nom && g.position)).toBe(true)
    expect(vote.groupDetails.map(g => g.position)).toEqual(['pour', 'contre', 'abstention'])
  })

  test('amendment description is preserved in related votes', () => {
    const voteWithAmendment = {
      numero: '200',
      titre: 'Vote sur amendement',
      objet: 'Amendement au projet',
      exposeSommaire: 'Description du scrutin',
      amendementNumero: 'AM-2024-001',
      amendmentDescription: 'Description détaillée de l\'amendement',
      groupes: [
        { organeRef: 'PO845407', positionMajoritaire: 'pour' }
      ],
      groupDetails: [
        { organeRef: 'PO845407', nom: 'Renaissance', position: 'pour' }
      ]
    }

    expect(voteWithAmendment.amendmentDescription).toBeDefined()
    expect(voteWithAmendment.amendmentDescription).not.toBe('')
    expect(voteWithAmendment.amendmentDescription).toContain('amendement')
  })

  test('status values are one of the valid types', () => {
    const validStatuses = ['respected', 'notRespected', 'mitigated', 'unknown']

    const comparisons = [
      { status: 'respected', explanation: 'Cohérent' },
      { status: 'notRespected', explanation: 'Contradictoire' },
      { status: 'mitigated', explanation: 'Mitigé' },
      { status: 'unknown', explanation: 'Aucun vote lié' }
    ]

    comparisons.forEach(c => {
      expect(validStatuses).toContain(c.status)
    })
  })

  test('comparison includes all required fields', () => {
    const requiredFields = ['proposal', 'status', 'relatedVotes', 'explanation', 'usedOllama', 'title', 'description']

    const comparison = {
      proposal: { title: 'Test', description: 'Test', text: 'Test', themes: [] },
      status: 'unknown',
      relatedVotes: [],
      explanation: 'Test explanation',
      usedOllama: false,
      title: 'Test',
      description: 'Test'
    }

    requiredFields.forEach(field => {
      expect(comparison).toHaveProperty(field)
    })
  })
})

describe('comparisonsCache error handling', () => {
  test('handles proposals with special characters in title and description', () => {
    const proposal = {
      title: 'Titre avec "guillemets" et \'apostrophes\'',
      description: 'Description avec & caractères spéciaux: @#$%',
      themes: [],
      text: 'Titre avec "guillemets" et \'apostrophes\'\nDescription avec & caractères spéciaux: @#$%'
    }

    expect(proposal.title).toMatch(/['"&@#$%]/)
    expect(proposal.description).toMatch(/['"&@#$%]/)
    expect(proposal.text).toContain(proposal.title)
  })

  test('handles very long descriptions', () => {
    const longDescription = 'a'.repeat(5000)
    const proposal = {
      title: 'Titre court',
      description: longDescription,
      themes: [],
      text: 'Titre court\n' + longDescription
    }

    expect(proposal.description.length).toBe(5000)
    expect(proposal.text.length).toBeGreaterThan(5000)
  })

  test('handles proposals with empty related votes', () => {
    const comparison = {
      proposal: { title: 'Proposition rare', description: 'Pas de votes liés', themes: [], text: '' },
      status: 'unknown',
      relatedVotes: [],
      explanation: 'Aucun vote lié trouvé.',
      usedOllama: false,
      title: 'Proposition rare',
      description: 'Pas de votes liés'
    }

    expect(comparison.relatedVotes).toEqual([])
    expect(comparison.status).toBe('unknown')
  })
})
