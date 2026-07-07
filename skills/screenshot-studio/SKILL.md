---
name: screenshot-studio
description: Work with Screenshot Studio, a local Next.js editor for App Store and Google Play screenshot showcases. Use when creating or editing showcase project JSON, arranging slides, text/image elements, mockup placement, backgrounds, localization, uploaded assets, export setup, or when debugging Screenshot Studio editor behavior.
---

# Screenshot Studio

Use this skill for Screenshot Studio project work and editor changes.

Screenshot Studio stores showcase content as local JSON project files and local
assets. Most showcase tasks should edit `projects/<slug>.json`; TypeScript
changes are only needed when changing editor features.

## First Steps

1. Inspect the repository root and read `README.md` if project context is not
   already clear.
2. Check `git status --short --ignored` before editing. User data is ignored by
   git and should not be staged unless explicitly requested.
3. For project JSON or schema work, read `references/project-schema.md`.
4. If the editor is running, avoid editing the same project JSON while it has
   unsaved browser changes. Wait for the saved indicator or stop the dev server.

## User Data Rules

Treat these paths as local user data:

- `projects/*.json`
- `public/screenshots/*`
- `public/backgrounds/*`
- `public/fonts/uploaded/*`
- `public/fonts/fonts.json`
- `app-store-screenshots.json`
- export folders and generated export zip files

Do not stage or commit user data by default. It is normal for these paths to
appear as ignored files in `git status --ignored`.

## Common Workflows

### Edit a Showcase

1. Identify the target project in `projects/<slug>.json`.
2. Read `references/project-schema.md`.
3. Edit only the relevant slides/elements.
4. Preserve existing localized copy unless the user asks to rewrite it.
5. Keep element transforms in canvas pixels for the active device.
6. Validate JSON formatting and, when practical, reload the editor.

### Create a New Showcase

1. Put source screenshots under `public/screenshots/<app>/<locale>/`.
2. Create `projects/<slug>.json` with schema version 2.
3. Use `scripts/seed-fitlinkpro.mjs` as a generator example when building
   projects programmatically.
4. Use `{locale}` in screenshot paths when every locale has equivalent files.
5. Open the editor and verify the project appears in the switcher.

### Change Editor Behavior

1. Prefer existing component patterns under `src/components/editor/`.
2. Keep project state changes flowing through `src/lib/storage.ts` and
   `src/lib/server/projects.ts`.
3. Preserve migration compatibility in `src/lib/migrations.ts` when adding
   project fields.
4. Run `npm run build`.
5. For rendered behavior, start the app with `npm run dev`, `start.command`,
   or `start.cmd`, then verify the target flow in the browser.

## Launching Locally

- macOS: double-click `start.command`.
- Windows: double-click `start.cmd`.
- Manual: run `npm install`, then `npm run dev`.

The editor normally opens at `http://localhost:3000`. Next.js may use another
port if `3000` is occupied.

## Validation

Use the smallest validation that matches the change:

- JSON-only showcase edits: parse the project JSON and inspect the rendered
  editor if layout matters.
- Editor TypeScript changes: run `npm run build`.
- Export/rendering changes: verify in a Chromium browser when possible.

Report any validation that could not be run.
