# Contribuer à Kinoument

Merci de votre intérêt pour contribuer à Kinoument ! Ce document vous guide sur comment contribuer au projet.

## Code of Conduct

Soyez respectueux et constructif. Nous sommes une communauté inclusive.

## Comment contribuer

### Reporting Bugs

1. **Vérifiez** que le bug n'existe pas déjà dans les issues ouvertes
2. **Ouvrez une issue** avec le template "Bug Report"
3. **Décrivez clairement**:
   - Les étapes pour reproduire
   - Le comportement attendu vs réel
   - Votre environnement (OS, Node version, navigateur)

### Proposer une feature

1. **Ouvrez une issue** avec le template "Feature Request"
2. **Décrivez**:
   - Le problème que résout cette feature
   - La solution proposée
   - Les alternatives envisagées

### Soumettre du code

1. **Fork** le repository
2. **Créez une branche**:
   ```bash
   git checkout -b feature/ma-feature
   # ou
   git checkout -b fix/mon-bugfix
   ```

3. **Faites vos changements**:
   - Respectez le style de code existant
   - Écrivez du code clair et bien nommé
   - Ajoutez des commentaires pour du code complexe

4. **Testez votre code**:
   ```bash
   npm run lint
   npm run build
   npm run dev
   ```

5. **Committez avec des messages clairs**:
   ```bash
   git commit -m "fix: corriger le bug dans le comparateur"
   git commit -m "feat: ajouter la comparaison côte à côte"
   ```
   Utilisez les préfixes: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`

6. **Poussez** vers votre fork:
   ```bash
   git push origin feature/ma-feature
   ```

7. **Ouvrez une Pull Request** avec le template fourni

## Guidelines de développement

### Structure du code

```
src/
├── pages/              # Pages Next.js
├── components/         # Composants React
├── lib/               # Fonctions utilitaires
├── styles/            # Styles globaux
└── public/            # Assets statiques
```

### Nommage

- **Fichiers** : camelCase pour JS, kebab-case pour CSS
- **Variables** : camelCase
- **Constantes** : UPPER_SNAKE_CASE
- **Composants** : PascalCase

### Code Style

- Utilisez ESLint: `npm run lint`
- Indentation: 2 espaces
- Pas de semicolons (sauf si nécessaire)
- Imports organisés: React, librairies externes, fichiers locaux

### Performance

- Utilisez `React.memo` pour les composants coûteux
- Optimisez les images avec Next.js Image
- Lazy load quand approprié
- Minimisez les re-renders

## Stack technologique

- **Framework** : Next.js 14
- **Frontend** : React 18
- **Parser** : node-html-parser
- **IA** : Ollama (Llama3)
- **Linting** : ESLint
- **Styles** : CSS-in-JS + Tailwind (si applicable)

## Documentation

- Mettez à jour le README si vous changez les dépendances
- Documentez les nouvelles APIs et fonctions
- Incluez des exemples pour les fonctionnalités complexes

## License

En contribuant, vous acceptez que vos contributions soient sous licence MIT.

## Questions ?

- 📧 Email: math.pernot30@gmail.com
- 💬 Ouvrez une discussion dans les Issues
- 🐛 Signalez les bugs via le template Bug Report

---

**Merci pour votre contribution ! 🙏**
