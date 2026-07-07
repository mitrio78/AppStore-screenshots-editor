# Screenshot Studio

A local web editor for creating App Store and Google Play screenshot showcases.
It is built with Next.js 15, React, and Tailwind CSS, and includes a canvas
editor, device mockups, custom text/image layers, local project storage, and
PNG/JPG export.

## Getting Started

### macOS Quick Start

Double-click `start.command` in Finder. The launcher installs dependencies on
first run, starts the local dev server, and opens the editor in your browser.

To stop the server, press `Ctrl+C` in the terminal window opened by
`start.command`.

### Windows Quick Start

Double-click `start.cmd` in File Explorer. The launcher installs dependencies on
first run, starts the local dev server, and opens the editor in your default
browser.

To stop the server, press `Ctrl+C` in the command window opened by `start.cmd`.

### Manual Start

```bash
npm install
npm run dev
```

The editor runs at:

```text
http://localhost:3000
```

If port `3000` is already in use, Next.js will automatically pick the next
available port.

## Features

- **Device mockups**: iPhone, iPad, Android phone/tablet, and Google Play
  feature graphic canvases.
- **Drag-and-drop screenshots**: drop an app screenshot directly onto the
  device frame.
- **Editable mockup placement**: resize, move, rotate, layer, and style the
  device mockup, including body color and custom shadow settings.
- **Slide backgrounds**: theme presets, solid colors, gradients, and image
  backgrounds with cover, contain, and panorama modes.
- **Freeform elements**: add text fields and image/sticker layers, then move,
  scale, rotate, reorder, duplicate, or delete them.
- **Typography controls**: font family, size, weight, color, alignment, line
  height, letter spacing, uppercase transform, opacity, and optional text boxes.
- **Clipboard modes**: copy/paste text with formatting, or paste text only while
  preserving the target text field style.
- **Template application**: apply the active slide layout/template to the rest
  of the deck while preserving each slide's own text content.
- **Localization**: text and screenshot paths support locales; screenshot paths
  can use the `{locale}` placeholder.
- **Bundled fonts**: Inter, Oswald, Manrope, Montserrat, Rubik, PT Sans, and
  Noto Sans are included with Cyrillic support and embedded into exports.
- **User fonts**: upload `.ttf`, `.otf`, `.woff`, or `.woff2` fonts locally.
- **Export**: export one slide or the full deck as PNG or JPG across selected
  store sizes and locales.
- **Undo/redo**: use `Cmd+Z` and `Shift+Cmd+Z`.

## Local User Data

Project files, uploaded screenshots, custom backgrounds, uploaded fonts, and
local exports are user data and are ignored by git.

Ignored local data includes:

- `projects/*.json`
- `public/screenshots/*`
- `public/backgrounds/*`
- `public/fonts/uploaded/*`
- `public/fonts/fonts.json`
- `exports/`, `exported/`, `downloads/`, and generated export zip files

A clean clone creates `projects/default.json` automatically on first launch.

## Project Files

Each showcase project is stored as pretty-printed JSON:

```text
projects/<slug>.json
```

The editor autosaves project changes to disk with a short debounce. Avoid
editing the same project JSON manually while the editor has unsaved changes
open in the browser.

## Export Output

When exporting multiple slides, Screenshot Studio creates a zip with this
layout:

```text
<platform>/<device>/<WxH>/<locale>/NN-<layout>.<ext>
```

Single-slide exports download directly as one image file.

Chrome or another Chromium-based browser is recommended for reliable export,
because Safari can be unreliable with `foreignObject` rendering.

## Local Deployment

```bash
docker build -t screenshot-studio .
docker run -d -p 127.0.0.1:3000:3000 \
  -v "$PWD/projects:/app/projects" \
  -v "$PWD/public/screenshots:/app/public/screenshots" \
  -v "$PWD/public/backgrounds:/app/public/backgrounds" \
  -v "$PWD/public/fonts:/app/public/fonts" \
  screenshot-studio
```

The write API is intentionally local-first. If you expose the app outside your
machine, put it behind a reverse proxy with authentication.

## Development Notes

```bash
npm run build
```

The project does not currently include a dedicated test suite. Use the local
editor and production build as the primary verification path.
