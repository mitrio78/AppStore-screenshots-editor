# Screenshot Studio Quick Context

Read `AGENTS.md` for the detailed project schema, file layout, coordinate
system, user-data policy, and workflow notes.

Quick facts:

- Dev server: `npm run dev` -> `http://localhost:3000`
- macOS launcher: double-click `start.command`
- Windows launcher: double-click `start.cmd`
- Projects live in `projects/<slug>.json`
- Project JSON, uploaded screenshots, custom backgrounds, uploaded fonts, and
  exports are local user data and are ignored by git
- Do not edit a project JSON while the editor has unsaved changes for it
- Core schema lives in `src/lib/types.ts`
- Project file storage lives in `src/lib/server/projects.ts`
- Browser/project autosave logic lives in `src/lib/storage.ts`
- No dedicated test suite yet; use `npm run build` and browser verification
- NEVER run `npm run build` (or `rm -rf .next`) while a server from this folder
  is running — the live server ends up with a corrupted/partial `.next` and
  every API route starts returning 404 (autosave breaks with "HTTP 404").
  Stop servers first (`./stop.command` / `stop.cmd`), build, then restart.
