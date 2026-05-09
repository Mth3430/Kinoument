# Guide de Test - Kinoument

## 📋 Vue d'ensemble des tests

Ce projet inclut des tests unitaires et d'intégration pour valider:
- La logique de comparaison des propositions avec les votes
- La structure et l'enrichissement des données avec les amendements
- L'intégration des descriptions d'amendements dans les comparaisons
- Les styles et la cohérence UI des composants

## 🧪 Fichiers de test

### 1. `src/lib/compareLogic.test.js`
Tests pour la logique de comparaison des propositions:
- Gestion des propositions en string ou objet
- Extraction du titre et de la description
- Enrichissement avec les amendements
- Gestion de plusieurs groupes parlementaires
- Limitation des votes liés quand trop nombreux

**Tests clés:**
```javascript
- test('handles object proposal with title and description')
- test('enriches votes with amendment descriptions')
- test('handles party group mapping correctly')
```

### 2. `src/lib/comparisonsCache.test.js`
Tests pour la structure et le stockage des comparaisons:
- Séparation correcte entre titre et description
- Extraction des thèmes
- Préservation des détails des amendements
- Types de statut valides

**Structure validée:**
```javascript
{
  proposal: {
    title: "Titre",
    description: "Description détaillée",
    themes: [{ name, color }],
    text: "Titre + Description pour comparaison"
  },
  status: "respected|notRespected|mitigated|unknown",
  relatedVotes: [...],
  description: "Description du résultat"
}
```

### 3. `src/lib/amendmentsCache.test.js`
Tests pour la gestion des amendements:
- Structure des données d'amendement
- Extraction du texte depuis structures imbriquées
- Enrichissement des votes avec descriptions d'amendement
- Gestion des erreurs et textes très longs

**Amendement enrichi:**
```javascript
{
  numero: 'AM-001',
  exposeSommaire: 'Description sommaire',
  dispositif: 'Dispositif',
  auteur: 'Groupe',
  sort: 'Adopté'
}
```

### 4. `src/lib/votesCache.test.js`
Tests pour la structure et le filtrage des votes:
- Format de date (YYYY-MM-DD)
- Positions valides (pour/contre/abstention)
- Extraction des numéros d'amendement
- Filtrage des votes après 2022
- Gestion des groupes parlementaires

**Vote enrichi:**
```javascript
{
  numero: '2023-001',
  titre: 'Titre du vote',
  objet: 'Description de l\'objet',
  exposeSommaire: 'Résumé du scrutin',
  date: '2023-01-15',
  amendementNumero: 'AM-001' | null,
  groupes: [
    { organeRef: 'PO845407', positionMajoritaire: 'pour' }
  ]
}
```

### 5. `src/components/DisclaimerPopup.test.js`
Tests pour la cohérence des styles UI:
- Utilisation de la police système (system-ui)
- Thème sombre/clair cohérent
- Accessibilité et readabilité
- Interactions et transitions

**Police corrigée:**
```javascript
fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
```

## 🚀 Exécution des tests

### Installation des dépendances de test
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Configuration Jest (package.json)
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/*.test.js"],
    "collectCoverageFrom": ["src/**/*.js"]
  }
}
```

### Commandes
```bash
# Exécuter tous les tests
npm test

# Mode watch (exécution automatique à chaque changement)
npm run test:watch

# Générer un rapport de couverture
npm run test:coverage

# Exécuter un fichier de test spécifique
npm test -- compareLogic.test.js

# Exécuter avec verbosité
npm test -- --verbose
```

## 📊 Métriques d'amélioration

### Avant les changements
- Amendements peu utilisés dans la comparaison
- Description de proposition pas toujours disponible
- Popup avec police incohérente avec le site

### Après les changements
- ✅ Amendements chargés et enrichissent les votes
- ✅ Description correctement séparée du titre
- ✅ Popup utilise système font pour cohérence
- ✅ Tests unitaires pour chaque module
- ✅ Tests d'intégration pour structure de données

## 🔧 Modifications du code

### 1. DisclaimerPopup.js
**Changement:** Ajout de `fontFamily` pour cohérence UI
```javascript
// Avant
<div style={{ ... }}>

// Après
<div style={{
  ...
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
}}>
```

### 2. compareLogic.js
**Changements:**
- Ajout de `enrichVotesWithAmendments()` pour charger les descriptions
- Inclusion des descriptions d'amendements dans les prompts IA
- Amélioration du scoring des votes avec amendements

```javascript
// Nouveau
async function enrichVotesWithAmendments(votes) {
  // Charge les descriptions des amendements pour chaque vote
}

const enrichedVotes = await enrichVotesWithAmendments(votes)
```

### 3. votesCache.js
**Pas de changement de code** - Les votes incluaient déjà les amendementNumero, 
mais compareLogic.js les utilise maintenant mieux.

### 4. amendmentsCache.js
**Pas de changement** - Le module fonctionnait déjà correctement.

## 📝 Cas de test couverts

### Logique de comparaison
- ✅ Propositions en string vs objet
- ✅ Titre et description séparés
- ✅ Amendements enrichis
- ✅ Aucun vote lié trouvé
- ✅ Groupes parlementaires mappés
- ✅ Limitation des votes trop nombreux

### Structure de données
- ✅ Tous les champs requis présents
- ✅ Types de données corrects
- ✅ Valeurs par défaut appropriées
- ✅ Caractères spéciaux gérés
- ✅ Textes très longs tronqués

### Amendements
- ✅ Structures imbriquées parsées
- ✅ Fallback quando données manquent
- ✅ Enrichissement des votes
- ✅ Amélioration du scoring

### UI/UX
- ✅ Cohérence de police
- ✅ Thème sombre/clair
- ✅ Accessibilité
- ✅ Interactions lisses

## 🐛 Débogage

### Voir les logs de test
```bash
npm test -- --verbose --no-coverage
```

### Tester un cas spécifique
```bash
npm test -- --testNamePattern="enriches votes with amendment"
```

### Voir la couverture
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## 📚 Documentation additionnelle

- `CLAUDE.md` - Instructions du projet
- `src/lib/compareLogic.js` - Logique de comparaison
- `src/lib/amendmentsCache.js` - Gestion des amendements
- `src/components/DisclaimerPopup.js` - Composant UI corrigé

## ✨ Prochaines étapes recommandées

1. **Exécuter les tests:** `npm test`
2. **Vérifier la couverture:** `npm run test:coverage`
3. **Tests E2E:** Ajouter des tests Cypress/Playwright pour les interactions UI
4. **Performance:** Tester les temps de comparaison avec 1000+ propositions
5. **Amendements:** Valider que les descriptions améliorent vraiment la pertinence
