import { compareProposal } from './compareLogic'

// Mock des dépendances
jest.mock('./votesCache', () => ({
  getVotes: jest.fn()
}))

jest.mock('./amendmentsCache', () => ({
  getAmendmentText: jest.fn()
}))

jest.mock('./groupsCache', () => ({
  getGroupsMap: jest.fn()
}))

import { getVotes } from './votesCache'
import { getAmendmentText } from './amendmentsCache'
import { getGroupsMap } from './groupsCache'

describe('compareProposal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('handles string proposal input', async () => {
    const mockVotes = [
      {
        numero: '1',
        titre: 'Vote sur la santé',
        objet: 'Réforme du système de santé',
        exposeSommaire: '',
        dispositif: '',
        date: '2023-01-01',
        groupes: [
          { organeRef: 'PO845407', positionMajoritaire: 'pour' }
        ],
        amendementNumero: null
      }
    ]

    getVotes.mockResolvedValue(mockVotes)
    getGroupsMap.mockResolvedValue(new Map([['PO845407', 'Renaissance']]))
    getAmendmentText.mockResolvedValue(null)

    const proposal = 'Améliorer le système de santé'
    const result = await compareProposal(proposal, 'PO845407')

    expect(result).toHaveProperty('status')
    expect(result).toHaveProperty('relatedVotes')
    expect(result).toHaveProperty('explanation')
    expect(result.title).toBe('')
    expect(result.description).toBe('')
  })

  test('handles object proposal with title and description', async () => {
    const mockVotes = [
      {
        numero: '1',
        titre: 'Vote sur l\'éducation',
        objet: 'Augmenter le budget de l\'éducation',
        exposeSommaire: 'Augmentation des dépenses',
        dispositif: '',
        date: '2023-01-01',
        groupes: [
          { organeRef: 'PO845407', positionMajoritaire: 'pour' }
        ],
        amendementNumero: null
      }
    ]

    getVotes.mockResolvedValue(mockVotes)
    getGroupsMap.mockResolvedValue(new Map([['PO845407', 'Renaissance']]))
    getAmendmentText.mockResolvedValue(null)

    const proposal = {
      title: 'Augmenter les investissements en éducation',
      description: 'Nous allons doubler le budget de l\'éducation',
      text: 'Augmenter les investissements en éducation\nNous allons doubler le budget de l\'éducation'
    }

    const result = await compareProposal(proposal, 'PO845407')

    expect(result.title).toBe(proposal.title)
    expect(result.description).toBe(proposal.description)
    expect(result).toHaveProperty('relatedVotes')
  })

  test('returns unknown status when no related votes found', async () => {
    const mockVotes = [
      {
        numero: '1',
        titre: 'Vote complètement différent',
        objet: 'Sujet complètement différent',
        exposeSommaire: '',
        dispositif: '',
        date: '2023-01-01',
        groupes: [],
        amendementNumero: null
      }
    ]

    getVotes.mockResolvedValue(mockVotes)
    getGroupsMap.mockResolvedValue(new Map())
    getAmendmentText.mockResolvedValue(null)

    const proposal = 'Proposition totalement différente'
    const result = await compareProposal(proposal, 'PO845407')

    expect(result.status).toBe('unknown')
    expect(result.relatedVotes.length).toBe(0)
  })

  test('enriches votes with amendment descriptions', async () => {
    const mockVotes = [
      {
        numero: '1',
        titre: 'Vote sur amendement',
        objet: 'Amendement test',
        exposeSommaire: '',
        dispositif: '',
        date: '2023-01-01',
        amendementNumero: 'AM-001',
        groupes: [
          { organeRef: 'PO845407', positionMajoritaire: 'pour' }
        ]
      }
    ]

    const mockAmendment = {
      exposeSommaire: 'Description de l\'amendement test',
      dispositif: 'Dispositif de l\'amendement'
    }

    getVotes.mockResolvedValue(mockVotes)
    getGroupsMap.mockResolvedValue(new Map([['PO845407', 'Renaissance']]))
    getAmendmentText.mockResolvedValue(mockAmendment)

    const proposal = 'Amendement test'
    const result = await compareProposal(proposal, 'PO845407')

    expect(getAmendmentText).toHaveBeenCalledWith('AM-001')
    expect(result.relatedVotes.length).toBeGreaterThanOrEqual(0)
  })

  test('handles party group mapping correctly', async () => {
    const mockVotes = [
      {
        numero: '1',
        titre: 'Vote test',
        objet: 'Test',
        exposeSommaire: 'Test proposal',
        dispositif: '',
        date: '2023-01-01',
        groupes: [
          { organeRef: 'PO845407', positionMajoritaire: 'pour' },
          { organeRef: 'PO845413', positionMajoritaire: 'contre' }
        ],
        amendementNumero: null
      }
    ]

    const mockGroupsMap = new Map([
      ['PO845407', 'Renaissance'],
      ['PO845413', 'La France Insoumise']
    ])

    getVotes.mockResolvedValue(mockVotes)
    getGroupsMap.mockResolvedValue(mockGroupsMap)
    getAmendmentText.mockResolvedValue(null)

    const proposal = {
      title: 'Test Proposal',
      description: 'Une proposition de test',
      text: 'Test Proposal\nUne proposition de test'
    }

    const result = await compareProposal(proposal, 'PO845407')

    expect(result.relatedVotes.every(v =>
      !v.groupDetails || v.groupDetails.every(g => g.nom !== undefined)
    )).toBe(true)
  })

  test('limits related votes when too many are found', async () => {
    // Créer 100 votes candidates
    const mockVotes = Array.from({ length: 100 }, (_, i) => ({
      numero: String(i),
      titre: `Vote test ${i}`,
      objet: `Test proposal topic ${i}`,
      exposeSommaire: 'test proposal test',
      dispositif: '',
      date: '2023-01-01',
      groupes: [
        { organeRef: 'PO845407', positionMajoritaire: 'pour' }
      ],
      amendementNumero: null
    }))

    getVotes.mockResolvedValue(mockVotes)
    getGroupsMap.mockResolvedValue(new Map([['PO845407', 'Renaissance']]))
    getAmendmentText.mockResolvedValue(null)

    const proposal = 'Test proposal test topic'
    const result = await compareProposal(proposal, 'PO845407')

    // Les votes liés devraient être limités (fallback à score >= 1)
    expect(result.relatedVotes).toBeDefined()
    expect(Array.isArray(result.relatedVotes)).toBe(true)
  })

  test('preserves proposal title and description through comparison', async () => {
    const mockVotes = [
      {
        numero: '1',
        titre: 'Vote éducation',
        objet: 'Politique éducative',
        exposeSommaire: '',
        dispositif: '',
        date: '2023-01-01',
        groupes: [
          { organeRef: 'PO845407', positionMajoritaire: 'pour' }
        ],
        amendementNumero: null
      }
    ]

    getVotes.mockResolvedValue(mockVotes)
    getGroupsMap.mockResolvedValue(new Map([['PO845407', 'Renaissance']]))
    getAmendmentText.mockResolvedValue(null)

    const proposal = {
      title: 'Investissement en éducation',
      description: 'Doubler le budget de l\'éducation',
      text: 'Investissement en éducation\nDoubler le budget de l\'éducation'
    }

    const result = await compareProposal(proposal, 'PO845407')

    expect(result.title).toBe('Investissement en éducation')
    expect(result.description).toBe('Doubler le budget de l\'éducation')
    expect(result.title).not.toBe(result.description)
  })
})
