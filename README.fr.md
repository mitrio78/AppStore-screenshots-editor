<h1 align="center">Screenshot Studio</h1>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ru.md">Русский</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.tr.md">Türkçe</a> ·
  <strong>Français</strong> ·
  <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <strong>Un éditeur visuel local pour créer et exporter des visuels App Store et Google Play.</strong>
</p>

<p align="center">
  Créez des captures de store soignées avec de vrais mockups d'appareils,
  des modèles de slides réutilisables, des textes localisés, une typographie
  personnalisée, le drag-and-drop et l'export PNG/JPG sans envoyer vos assets privés dans le cloud.
</p>

<p align="center">
  <a href="#démarrage-rapide">Démarrage rapide</a> ·
  <a href="#fonctionnalités">Fonctionnalités</a> ·
  <a href="#données-utilisateur-locales">Données locales</a> ·
  <a href="#codex-skill">Codex Skill</a>
</p>

<p align="center">
  <strong>Thème clair</strong><br>
  <img src="docs/assets/screenshot-studio-light.png" alt="Éditeur Screenshot Studio en thème clair avec liste de slides, canvas, mockup d'appareil et réglages de slide" width="100%">
</p>

<p align="center">
  <strong>Thème sombre</strong><br>
  <img src="docs/assets/screenshot-studio-dark.png" alt="Éditeur Screenshot Studio en thème sombre avec liste de slides, canvas, mockup d'appareil et réglages de slide" width="100%">
</p>

## Pourquoi Screenshot Studio?

Screenshot Studio est un éditeur web local pour les équipes et développeurs indépendants qui veulent des captures de store
répétables, éditables et exportables. Il est construit avec Next.js 15, React et Tailwind CSS. Les projets sont stockés
en JSON avec des captures, fonds et polices locaux.

## Démarrage rapide

### macOS

Double-cliquez sur `start.command` dans Finder. Le lanceur installe les dépendances au premier lancement,
démarre le serveur local et ouvre l'éditeur dans le navigateur.

Pour arrêter le serveur, appuyez sur `Ctrl+C` dans le terminal ouvert par `start.command`.

### Windows

Double-cliquez sur `start.cmd` dans File Explorer. Le lanceur installe les dépendances au premier lancement,
démarre le serveur local et ouvre l'éditeur dans le navigateur par défaut.

Pour l'arrêter, appuyez sur `Ctrl+C` dans la fenêtre ouverte par `start.cmd`.

### Démarrage manuel

```bash
npm install
npm run dev
```

L'éditeur est disponible à l'adresse:

```text
http://localhost:3000
```

Si le port `3000` est occupé, Next.js choisira automatiquement le prochain port disponible.

## Fonctionnalités

- **Mockups d'appareils**: iPhone, iPad, Android phone/tablet et Google Play feature graphic.
- **Drag-and-drop**: déposez une capture directement sur le cadre de l'appareil.
- **Placement du mockup**: redimensionnement, position, rotation, calques, couleur du corps et ombre.
- **Fonds de slides**: thèmes, couleurs, dégradés et images avec modes cover, contain et panorama.
- **Éléments libres**: textes, images, stickers et badges à déplacer, redimensionner, tourner, dupliquer ou supprimer.
- **Typographie**: famille, taille, poids, couleur, alignement, hauteur de ligne, espacement, uppercase, opacité et boîtes de texte.
- **Modes presse-papiers**: copier/coller avec format ou coller seulement le texte en gardant le style cible.
- **Application de modèle**: appliquer le layout du slide actif au reste du deck en conservant les textes.
- **Aperçu en ligne de store**: voir le deck comme un carrousel horizontal de store.
- **Localisation de l'éditeur**: UI en anglais, russe et japonais, extensible avec d'autres dictionnaires.
- **Localisation du contenu**: textes et chemins de captures avec locales et placeholder `{locale}`.
- **Polices incluses**: Inter, Oswald, Manrope, Montserrat, Rubik, PT Sans et Noto Sans.
- **Polices utilisateur**: import local de `.ttf`, `.otf`, `.woff` et `.woff2`.
- **Export**: un slide ou tout le deck en PNG/JPG pour les tailles et locales sélectionnées.
- **Undo/redo**: `Cmd+Z` et `Shift+Cmd+Z`.

## Données utilisateur locales

Les projets, captures importées, fonds personnalisés, polices importées et exports locaux sont des données utilisateur
et sont ignorés par git.

Chemins ignorés:

- `projects/*.json`
- `public/screenshots/*`
- `public/backgrounds/*`
- `public/fonts/uploaded/*`
- `public/fonts/fonts.json`
- `exports/`, `exported/`, `downloads/` et zips d'export générés

Un clone propre crée automatiquement `projects/default.json` au premier lancement.

## Fichiers de projet

Chaque vitrine est stockée en JSON formaté:

```text
projects/<slug>.json
```

L'éditeur sauvegarde automatiquement avec un court délai. N'éditez pas le même JSON manuellement si le navigateur a
des changements non sauvegardés.

## Export

Pour plusieurs slides, Screenshot Studio crée un zip avec cette structure:

```text
<platform>/<device>/<WxH>/<locale>/NN-<layout>.<ext>
```

Un seul slide est téléchargé directement comme image. Chrome ou un navigateur Chromium est recommandé, car Safari peut
être instable avec `foreignObject`.

## Déploiement local

```bash
docker build -t screenshot-studio .
docker run -d -p 127.0.0.1:3000:3000 \
  -v "$PWD/projects:/app/projects" \
  -v "$PWD/public/screenshots:/app/public/screenshots" \
  -v "$PWD/public/backgrounds:/app/public/backgrounds" \
  -v "$PWD/public/fonts:/app/public/fonts" \
  screenshot-studio
```

L'API d'écriture est conçue en local-first. Si vous exposez l'app, placez-la derrière un reverse proxy avec authentification.

## Développement

```bash
npm run build
```

Il n'y a pas encore de suite de tests dédiée. L'éditeur local et le build de production sont les principales vérifications.

## Codex Skill

Ce dépôt inclut un Codex skill réutilisable:

```text
skills/screenshot-studio
```

Installation macOS ou Linux:

```bash
mkdir -p ~/.codex/skills
ln -s "$(pwd)/skills/screenshot-studio" ~/.codex/skills/screenshot-studio
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills"
New-Item -ItemType Junction `
  -Path "$env:USERPROFILE\.codex\skills\screenshot-studio" `
  -Target "$PWD\skills\screenshot-studio"
```

Si les junctions ne sont pas disponibles, copiez le dossier:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills"
Copy-Item -Recurse -Force ".\skills\screenshot-studio" "$env:USERPROFILE\.codex\skills\"
```

Redémarrez Codex ou ouvrez un nouveau thread. Vous pourrez ensuite demander à Codex d'utiliser `$screenshot-studio`.
