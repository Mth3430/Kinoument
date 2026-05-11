# Kinoument 🗳️

> **Comparateur de programmes politiques français**
> 
> Une application web qui compare les promesses électorales des partis politiques français contre leurs votes réels au Parlement.

## 🎯 À propos

Kinoument analyse les discours politiques en les confrontant à la réalité. Il scrape automatiquement les propositions de programme des partis politiques français depuis [tous-les-programmes.fr](https://www.tous-les-programmes.fr) et les compare avec plus de 6 000 votes parlementaires réels en utilisant un système de matching par thèmes et d'heuristiques strictes.

**Objectif** : Fournir aux citoyens une vision objective et basée sur les données des écarts entre les promesses électorales et les actions réelles des partis au Parlement.

## ✨ Fonctionnalités principales

- **📊 Scraping automatique** : Récupère tous les programmes politiques depuis les sites officiels des partis
- **🎯 Matching par thèmes** : Utilise des heuristiques strictes basées sur les thèmes pour lier propositions aux votes
- **✅ Classification du respect** : 
  - ✓ Respecté - la majorité des votes du parti sont POUR la proposition
  - ✗ Non respecté - la majorité des votes du parti sont CONTRE la proposition  
  - ≈ Mitigé - le parti est divisé (votes pour et contre)
- **📱 Interface interactive** : Grille de propositions avec chargement par scroll
- **🔍 Pages de détail** : Vue complète de chaque proposition avec votes liés
- **🌓 Mode sombre/clair** : Support complet des thèmes visuels
- **🌍 Multilingue** : Support français et anglais

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ 
- npm ou yarn
- [Ollama](https://ollama.ai) installé localement (pour les analyses IA)

### Installation

```bash
# Cloner le repository
git clone https://github.com/Mth3430/Kinoument.git
cd Kinoument

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Build pour la production

```bash
npm run build
npm run start
```

## 📖 Utilisation

1. **Explorer les programmes** : Accédez à la page d'accueil pour voir les partis disponibles
2. **Consulter les propositions** : Cliquez sur un parti pour voir toutes ses propositions
3. **Analyser les détails** : Cliquez sur une proposition pour voir :
   - La description complète
   - Les thématiques associées
   - Les votes parlementaires liés
   - L'analyse IA détaillée
4. **Comparer** : Utilisez la grille pour comparer rapidement le respect des promesses

## 🏛️ Partis politiques suivis

| Parti | Statut | Abbr |
|-------|--------|------|
| Renaissance | ✅ | LREM |
| Les Républicains | ✅ | LR |
| La France Insoumise | ✅ | LFI |
| Rassemblement National | ✅ | RN |
| Parti Socialiste | ✅ | PS |
| Europe Écologie Les Verts | ✅ | EELV |
| Parti Communiste Français | ✅ | PCF |
| Reconquête | ✅ | REC |
| Place Publique | ✅ | PP |
| Lutte Ouvrière | 🔄 | LO |

## 🏗️ Architecture

### Stack technologique
- **Frontend** : Next.js 14 (App Router)
- **API** : Routes API Next.js (Pages Router)
- **Scraping** : node-html-parser
- **Matching** : Système de thèmes + heuristiques strictes (no-AI approach)
- **Graphiques** : Recharts
- **Stockage** : Disk cache (fichiers locaux)

### Flux de données
```
1. Scraper → tous-les-programmes.fr
2. Extraction propositions avec thèmes
3. Cache disque → Stockage propositions
4. Récupération votes parlementaires (4106+ votes)
5. Matching par thèmes stricts
6. Enrichissement votes avec amendements
7. Calcul cohérence (POUR=respecté, CONTRE=non-respecté)
8. API → Frontend
9. Grille interactive → Utilisateur
```

### Algorithme de matching
1. **Extraction de thèmes** : Chaque proposition a des thèmes (Éducation, Santé, etc.)
2. **Filtrage par thèmes** : Les votes sont recherchés s'ils mentionnent les mêmes thèmes
3. **Rejet des domaines différents** : Si un vote mentionne un domaine complètement différent (agriculture pour une proposition sur éducation), il est rejeté
4. **Max 10 votes** : Chaque proposition peut avoir au maximum 10 votes liés
5. **Cohérence simple** : Si le parti a voté POUR = respecté; CONTRE = non-respecté

### Structure du projet
```
src/
├── pages/
│   ├── api/
│   │   ├── comparisons.js      # Endpoint principal
│   │   ├── scraper.js          # Scraping logic
│   │   └── diskCache.js        # Cache persistence
│   ├── index.js                # Home
│   ├── party/[slug].js         # Party detail
│   └── proposal/[id].js        # Proposal detail
├── components/
│   ├── ProposalGrid.jsx        # Main grid view
│   ├── ProposalCard.jsx        # Proposal card
│   └── Navigation.jsx          # Top navigation
└── public/
    └── data/                   # Cached proposals
```

## 📋 Prochaines mises à jour (Roadmap)

### 🤖 Amélioration de l'IA
- **Meilleure détection de pertinence** : Améliorer l'algorithme de matching entre propositions et votes
- **Support multilingue avancé** : Traduction automatique des documents officiels
- **Fine-tuning du modèle** : Adapter Llama3 au contexte politique français spécifique
- **Explainability** : Fournir des justifications détaillées sur chaque score d'analyse

### 👥 Index de fiabilité et transparence
- **Casier judiciaire des députés** : Ajouter un indicateur du nombre de personnes élues avec antécédents judiciaires pour améliorer la fiabilité et la transparence
- **Score de cohérence personnelle** : Mesurer la congruence entre les votes des députés et les positions du parti
- **Historique des revirements** : Tracker les changements de positions par parti au fil du temps
- **Métadonnées complètes** : Source des données, date d'analyse, version du modèle IA utilisé

### 🎁 Surprises à venir

## 🛠️ Développement

### Commandes disponibles
```bash
npm run dev      # Serveur de développement avec hot reload
npm run build    # Compilation pour production
npm run start    # Serveur production
npm run lint     # Vérification ESLint
```

### Variables d'environnement
```bash
# .env.local ou .env
NEXT_PUBLIC_API_URL=http://localhost:3000
OLLAMA_URL=http://localhost:11434  # URL du serveur Ollama
```

## 📊 Statistiques

- **6000+** votes parlementaires analysés
- **9** partis politiques suivis
- **1500+** propositions extraites et analysées

## 🤝 Contribution

Les contributions sont bienvenues ! Que ce soit pour :
- 🐛 Signaler des bugs
- ✨ Proposer des améliorations
- 📝 Améliorer la documentation
- 🎨 Proposer des changements de design

**Comment contribuer** :
1. Fork le repository
2. Créez une branche `feature/votre-feature` ou `fix/votre-bugfix`
3. Committez vos changements
4. Poussez vers votre fork
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE) - libre d'utilisation à titre personnel et commercial.

## 👤 Auteur

- **Mathieu Pernot** - [GitHub](https://github.com/Mth3430)

## 📧 Contact

Pour des questions ou suggestions : math.pernot30@gmail.com

## 🔗 Ressources utiles

- [Tous les programmes](https://www.tous-les-programmes.fr) - Source des données
- [Ollama](https://ollama.ai) - Moteur IA utilisé
- [Next.js Documentation](https://nextjs.org/docs) - Framework utilisé

---

**Made with ❤️ by a civic tech enthusiast**

*Kinoument - Éclaircir les discours politiques par les faits*
