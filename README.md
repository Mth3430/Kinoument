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
- **🔍 Filtres avancés** : Filtrer par statut (Respectés, Mitigés, Non respectés) et par thèmes
- **📱 Interface interactive** : Grille de propositions avec chargement par scroll
- **📊 Sondages présidentiels** : Affiche les moyennes de sondages avec légende explicative
- **🔍 Pages de détail** : Vue complète de chaque proposition avec votes liés et amendements
- **🌓 Mode sombre/clair** : Support complet des thèmes visuels
- **📱 Mobile-first** : Design entièrement responsive pour tous les appareils
- **🌍 Multilingue** : Support français et anglais
- **ℹ️ Pages informatives** : Page "À propos" et "Mentions légales" complètes

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

1. **Page d'accueil** : Consultez les sondages présidentiels et sélectionnez un parti
2. **Consulter les propositions** : Cliquez sur un parti pour voir toutes ses propositions
3. **Filtrer les résultats** : 
   - Par **statut** : Respectés, Mitigés, Non respectés
   - Par **thèmes** : Éducation, Santé, Économie, etc.
4. **Analyser les détails** : Cliquez sur une proposition pour voir :
   - La description complète
   - Les thématiques associées
   - Les votes parlementaires liés et amendements
   - L'analyse détaillée de cohérence
5. **En savoir plus** : 
   - Page "À propos" pour la mission et la technologie
   - "Mentions légales" pour les informations légales et contact

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
├── app/
│   ├── page.js                 # Homepage avec sondages
│   ├── a-propos/
│   │   └── page.js             # Page À propos
│   ├── mentions-legales/
│   │   └── page.js             # Page Mentions légales
│   └── parti/[slug]/
│       ├── page.js             # Page parti avec filtres
│       └── proposal/[index]/
│           └── page.js         # Détail proposition
├── pages/api/
│   ├── comparisons.js          # Endpoint comparaisons
│   ├── proposal.js             # Détail proposition
│   ├── polls.js                # Données sondages
│   ├── polls-update.js         # Mise à jour sondages
│   └── ollama-test.js          # Test connexion Ollama
├── components/
│   ├── Navigation.js           # Navigation top
│   ├── PollChart.js            # Graphique sondages
│   └── DisclaimerPopup.js      # Popup avertissement
└── lib/
    ├── compareLogic.js         # Matching logic
    ├── votesCache.js           # Cache votes
    └── amendmentsCache.js      # Cache amendements
```

## 📋 Prochaines mises à jour (Roadmap)

### 🔧 Système de cache et reloading
- **Cache persistent** : Sauvegarder le cache sans le perdre lors des mises à jour
- **Commandes npm** : Relancer l'analyse pour tous les partis ou un seul
- **Historique du cache** : Backup automatique avant les mises à jour

### 🤖 Amélioration de l'IA
- **Fine-tuning du modèle** : Adapter Mistral au contexte politique français
- **Meilleure détection de pertinence** : Affiner l'algorithme de matching

### 👥 Index de fiabilité et transparence
- **Score de cohérence personnelle** : Mesurer la congruence entre les votes des députés et les positions du parti
- **Historique des revirements** : Tracker les changements de positions par parti au fil du temps
- **Comparaison inter-partis** : Vue comparative des positions sur des thèmes spécifiques

### 📊 Visualisations avancées
- **Graphiques de tendances** : Évolution de la cohérence par parti dans le temps
- **Heatmaps thématiques** : Visualiser les forces et faiblesses de chaque parti par domaine
- **Analyse des votes** : Détail des votes par amendement avec justifications

## 🛠️ Développement

### Commandes disponibles
```bash
npm run dev           # Serveur de développement avec hot reload (cache only)
npm run update-cache  # Met à jour le cache en arrière-plan (pas d'interruption API)
npm run build         # Compilation pour production
npm run start         # Serveur production
npm run lint          # Vérification ESLint
```

### 📦 Système de cache

**Mode rapide (par défaut)** :
- `npm run dev` lance le serveur avec le cache existant uniquement
- Démarrage ultra-rapide (< 2 secondes)
- Pas de recomparaisons, l'API retourne immédiatement les données en cache

**Mise à jour du cache** :
- `npm run update-cache` lance une mise à jour en arrière-plan
- Le serveur continue de fonctionner avec le cache actuel pendant la mise à jour
- Une fois la mise à jour terminée, le nouveau cache remplace l'ancien automatiquement
- Aucune interruption du service utilisateur

### Variables d'environnement
```bash
# .env.local ou .env
NEXT_PUBLIC_API_URL=http://localhost:3000

# Ollama Configuration
OLLAMA_URL=http://localhost:11434/api/generate  # URL du serveur Ollama (défaut: localhost)
OLLAMA_MODEL=mistral                            # Modèle Ollama (défaut: mistral)
```

**Configuration serveur distant** :
```bash
# Sur un serveur avec Ollama distant
OLLAMA_URL=http://192.168.1.100:11434/api/generate
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

- **Mathieu Pernot** - [GitHub](https://github.com/Mth3430) | [LinkedIn](https://linkedin.com/in/mathieu-pernot)

## 📧 Contact

Pour des questions ou suggestions : info@kinoument.fr

## 🔗 Ressources utiles

- [Tous les programmes](https://www.tous-les-programmes.fr) - Source des données
- [Ollama](https://ollama.ai) - Moteur IA utilisé
- [Next.js Documentation](https://nextjs.org/docs) - Framework utilisé

---

**Made with ❤️ by a civic tech enthusiast**

*Kinoument - Éclaircir les discours politiques par les faits*
