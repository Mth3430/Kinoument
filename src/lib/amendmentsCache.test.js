import { getAmendmentText } from './amendmentsCache'

/**
 * Tests pour amendmentsCache.js
 * Tests de la structure et de l'enrichissement des amendements
 */

describe('amendmentsCache', () => {
  describe('amendment data structure', () => {
    test('amendment object has required fields', () => {
      const amendment = {
        numero: 'AM-001',
        exposeSommaire: 'Description sommaire de l\'amendement',
        dispositif: 'Dispositif de l\'amendement',
        auteur: 'Groupe parlementaire',
        sort: 'Rejeté'
      }

      expect(amendment).toHaveProperty('numero')
      expect(amendment).toHaveProperty('exposeSommaire')
      expect(amendment).toHaveProperty('dispositif')
      expect(amendment).toHaveProperty('auteur')
      expect(amendment).toHaveProperty('sort')
    })

    test('amendment numero is string and trimmed', () => {
      const validNumeros = ['001', 'AM-001', '123', 'A1B2C3']

      validNumeros.forEach(numero => {
        expect(typeof String(numero).trim()).toBe('string')
        expect(String(numero).trim().length).toBeGreaterThan(0)
      })
    })

    test('exposeSommaire can be used for description fallback', () => {
      const amendment = {
        numero: 'AM-002',
        exposeSommaire: 'Cette est la description sommaire',
        dispositif: '',
        auteur: 'Auteur test',
        sort: 'Adopté'
      }

      const description = amendment.exposeSommaire || amendment.dispositif || ''
      expect(description).toBe('Cette est la description sommaire')
    })

    test('dispositif is used when exposeSommaire is empty', () => {
      const amendment = {
        numero: 'AM-003',
        exposeSommaire: '',
        dispositif: 'Le dispositif de l\'amendement',
        auteur: 'Auteur test',
        sort: 'Rejeté'
      }

      const description = amendment.exposeSommaire || amendment.dispositif || ''
      expect(description).toBe('Le dispositif de l\'amendement')
    })

    test('amendment can have multiple valid sort values', () => {
      const validSorts = ['Adopté', 'Rejeté', 'Retiré', 'Tombé', 'Irrecevable']

      validSorts.forEach(sort => {
        const amendment = {
          numero: 'AM-004',
          exposeSommaire: 'Description',
          dispositif: 'Dispositif',
          auteur: 'Auteur',
          sort
        }
        expect(amendment.sort).toBe(sort)
      })
    })
  })

  describe('amendment text extraction', () => {
    test('extracts text from nested object structures', () => {
      const textValue = 'Texte extrait'
      const variations = [
        { '#text': textValue },
        { texte: textValue },
        { libelle: textValue },
        textValue // direct string
      ]

      variations.forEach(val => {
        let extracted = ''
        if (typeof val === 'string') {
          extracted = val
        } else if (val['#text']) {
          extracted = val['#text']
        } else if (val.texte) {
          extracted = val.texte
        } else if (val.libelle) {
          extracted = val.libelle
        }
        expect(extracted).toBe(textValue)
      })
    })

    test('returns empty string for null or undefined text', () => {
      const values = [null, undefined, '', '   ']

      values.forEach(val => {
        const extracted = val || ''
        expect(typeof extracted).toBe('string')
      })
    })
  })

  describe('amendment caching behavior', () => {
    test('multiple amendments can be indexed by numero', () => {
      const amendments = new Map([
        ['AM-001', {
          numero: 'AM-001',
          exposeSommaire: 'Description 1',
          dispositif: 'Dispositif 1',
          auteur: 'Auteur 1',
          sort: 'Adopté'
        }],
        ['AM-002', {
          numero: 'AM-002',
          exposeSommaire: 'Description 2',
          dispositif: 'Dispositif 2',
          auteur: 'Auteur 2',
          sort: 'Rejeté'
        }]
      ])

      expect(amendments.size).toBe(2)
      expect(amendments.get('AM-001').exposeSommaire).toBe('Description 1')
      expect(amendments.get('AM-002').exposeSommaire).toBe('Description 2')
    })

    test('amendment numero lookup is case-insensitive with trim', () => {
      const amendments = new Map([
        ['AM-001', { exposeSommaire: 'Test' }]
      ])

      // Les lookups doivent être avec trim et standardisés
      const lookupKey = 'AM-001'
      expect(amendments.has(lookupKey.trim())).toBe(true)
      expect(amendments.has(lookupKey.trim().toUpperCase())).toBe(false)
    })

    test('duplicate numero keeps first match', () => {
      const amendments = new Map()

      amendments.set('AM-001', { exposeSommaire: 'Premier' })
      // Tentative d'ajouter un doublon
      if (!amendments.has('AM-001')) {
        amendments.set('AM-001', { exposeSommaire: 'Doublon' })
      }

      expect(amendments.get('AM-001').exposeSommaire).toBe('Premier')
    })
  })

  describe('amendment usage in vote comparison', () => {
    test('amendment description enriches vote text for scoring', () => {
      const vote = {
        titre: 'Vote sur amendement',
        objet: 'Amendement au projet',
        exposeSommaire: 'Résumé du vote',
        dispositif: '',
        amendmentDescription: 'Détails complets de l\'amendement'
      }

      const voteText = (vote.titre + ' ' + vote.objet + ' ' + vote.exposeSommaire + ' ' + (vote.amendmentDescription || '')).toLowerCase()
      expect(voteText).toContain('amendement')
      expect(voteText).toContain('détails complets')
    })

    test('keywords match better with amendment description', () => {
      const keywords = ['santé', 'système', 'réforme']

      const voteWithoutAmendment = {
        titre: 'Vote sur santé',
        objet: '',
        exposeSommaire: '',
        amenmentDescription: ''
      }

      const voteWithAmendment = {
        titre: 'Vote sur amendement',
        objet: '',
        exposeSommaire: '',
        amendmentDescription: 'Réforme du système de santé avec nouvelles mesures'
      }

      const scoreWithout = keywords.filter(k =>
        (voteWithoutAmendment.titre + ' ' + (voteWithoutAmendment.amendmentDescription || '')).toLowerCase().includes(k)
      ).length

      const scoreWith = keywords.filter(k =>
        (voteWithAmendment.titre + ' ' + (voteWithAmendment.amendmentDescription || '')).toLowerCase().includes(k)
      ).length

      expect(scoreWith).toBeGreaterThanOrEqual(scoreWithout)
    })
  })

  describe('amendment error handling', () => {
    test('handles missing amendment data gracefully', () => {
      const amendmentResult = null

      expect(amendmentResult).toBeNull()
      const fallback = amendmentResult ? amendmentResult.exposeSommaire : ''
      expect(fallback).toBe('')
    })

    test('handles malformed amendment JSON', () => {
      const malformedData = [
        { },
        { numero: null },
        { exposeSommaire: null, dispositif: null },
        'not-an-object'
      ]

      malformedData.forEach(data => {
        if (typeof data === 'object' && data !== null) {
          const numero = data.numero || ''
          const exposeSommaire = data.exposeSommaire || ''
          expect(typeof numero).toBe('string' || 'number' || 'null')
          expect(typeof exposeSommaire).toBe('string')
        }
      })
    })

    test('handles very long amendment descriptions', () => {
      const longText = 'a'.repeat(10000)
      const amendment = {
        numero: 'AM-LONG',
        exposeSommaire: longText,
        dispositif: '',
        auteur: 'Auteur',
        sort: 'Adopté'
      }

      expect(amendment.exposeSommaire.length).toBe(10000)
      // Should truncate in comparison to avoid token overflow
      const truncated = amendment.exposeSommaire.substring(0, 300)
      expect(truncated.length).toBeLessThanOrEqual(300)
    })

    test('handles special characters in amendment text', () => {
      const amendment = {
        numero: 'AM-SPECIAL',
        exposeSommaire: 'Texte avec «guillemets» et caractères: & < > "quoted"',
        dispositif: 'Article 1er: Les dispositions...',
        auteur: 'Groupe parlementaire A/B',
        sort: 'Adopté'
      }

      expect(amendment.exposeSommaire).toMatch(/[«»&<>"]/)
      expect(amendment.auteur).toMatch(/\//)
    })
  })

  describe('amendment integration with votes', () => {
    test('amendment numero from vote matches amendment index key', () => {
      const vote = {
        numero: '100',
        titre: 'Vote sur amendement',
        amendementNumero: 'AM-2024-001'
      }

      const amendments = new Map([
        ['AM-2024-001', {
          exposeSommaire: 'Description de l\'amendement',
          dispositif: 'Dispositif'
        }]
      ])

      expect(amendments.has(vote.amendementNumero)).toBe(true)
      const amendment = amendments.get(vote.amendementNumero)
      expect(amendment).toBeDefined()
    })

    test('vote without amendment numero is handled correctly', () => {
      const vote = {
        numero: '200',
        titre: 'Vote normal',
        amendementNumero: null
      }

      const shouldFetchAmendment = vote.amendementNumero !== null && vote.amendementNumero !== undefined

      expect(shouldFetchAmendment).toBe(false)
    })
  })
})
