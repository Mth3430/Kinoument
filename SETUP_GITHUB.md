# 🚀 Setup GitHub - Kinoument

Guide complet pour initialiser le git local et pousser sur GitHub.

## ✅ Préparation complétée

Les fichiers suivants ont été créés et configurés:

- ✅ **README.md** - Documentation complète avec roadmap
- ✅ **LICENSE** - License MIT
- ✅ **.gitignore** - Configuration Git optimisée
- ✅ **CONTRIBUTING.md** - Guide de contribution
- ✅ **.github/ISSUE_TEMPLATE/bug_report.md** - Template bug report
- ✅ **.github/ISSUE_TEMPLATE/feature_request.md** - Template feature request
- ✅ **.github/pull_request_template.md** - Template pull request

## 📋 Étapes pour pousser sur GitHub

### 1️⃣ Initialiser le repository local

```bash
cd c:\Users\mathi\Desktop\Kinoument
git init
git add .
git commit -m "Initial commit: Kinoument - French political program comparator"
```

### 2️⃣ Ajouter le remote GitHub

```bash
git remote add origin https://github.com/Mth3430/Kinoument.git
```

### 3️⃣ Renommer la branche principale (si nécessaire)

```bash
git branch -M main
```

### 4️⃣ Pousser vers GitHub

```bash
git push -u origin main
```

## 🔧 Alternative - Ligne par ligne

Si vous préférez, exécutez ces commandes une par une:

```bash
# Naviguez au dossier du projet
cd "c:\Users\mathi\Desktop\Kinoument"

# Initialiser git
git init

# Ajouter tous les fichiers
git add .

# Faire le premier commit
git commit -m "Initial commit: Kinoument - French political program comparator"

# Ajouter le remote
git remote add origin https://github.com/Mth3430/Kinoument.git

# Renommer la branche
git branch -M main

# Pousser vers GitHub
git push -u origin main
```

## ⚠️ Important avant de pousser

1. **Vérifiez les fichiers** à ignorer:
   ```bash
   git status
   ```
   Assurez-vous que `node_modules/`, `.env`, `.next/` ne sont pas listés

2. **Vérifiez votre configuration git** (email et nom):
   ```bash
   git config user.name
   git config user.email
   ```
   
   Si nécessaire, configurez-les:
   ```bash
   git config --global user.name "Mathieu Pernot"
   git config --global user.email "math.pernot30@gmail.com"
   ```

3. **Vérifiez l'URL du remote**:
   ```bash
   git remote -v
   ```

## 🎉 Après le push

Une fois poussé, vous pouvez:

1. **Vérifier le repository** sur GitHub: https://github.com/Mth3430/Kinoument

2. **Configurer GitHub** (optionnel):
   - Ajouter une description
   - Ajouter des topics (tags)
   - Configurer les protections de branche
   - Activer GitHub Pages si nécessaire

3. **Ajouter une section importante** au README:

```markdown
## 📦 Installation depuis GitHub

```bash
git clone https://github.com/Mth3430/Kinoument.git
cd Kinoument
npm install
npm run dev
```
```

## 🚨 Problèmes courants

### "fatal: not a git repository"
→ Vous n'avez pas exécuté `git init`

### "Permission denied"
→ Vérifiez que le token ou SSH key est configuré sur GitHub

### "Repository already exists"
→ Le repository existe déjà sur GitHub. Utilisez `git push` ou créez-le d'abord

### "nothing to commit"
→ Tous les fichiers sont déjà committés

## 📝 Commandes git utiles pour la suite

```bash
# Voir l'historique
git log

# Voir les changements
git status

# Ajouter des fichiers spécifiques
git add src/pages/index.js

# Créer une branche
git checkout -b feature/ma-feature

# Pousser une branche
git push origin feature/ma-feature

# Voir toutes les branches
git branch -a
```

## ✨ Prochaines étapes

1. **Créer une branche de développement**:
   ```bash
   git checkout -b develop
   git push -u origin develop
   ```

2. **Configurer GitHub Actions** (CI/CD) - optionnel:
   Créer `.github/workflows/test.yml` pour les tests automatiques

3. **Inviter des collaborateurs** (optionnel):
   Accéder aux Settings → Collaborators du repository

---

**Besoin d'aide?** → math.pernot30@gmail.com
