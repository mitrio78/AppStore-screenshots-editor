# Screenshot Studio - Guide for AI Agents

Screenshot Studio is a local web editor for App Store and Google Play
screenshot showcases. Most showcase work is plain JSON plus local image/font
assets; TypeScript changes are only needed for editor features.

## Project Shape

| Path | Purpose |
| --- | --- |
| `projects/<slug>.json` | One local showcase project. Pretty-printed user data, git-ignored by default. |
| `public/screenshots/<app>/<locale>/*` | Local source screenshots for a project. User data, git-ignored by default. |
| `public/screenshots/uploaded/*` | Screenshots dropped into the editor. User data, git-ignored by default. |
| `public/backgrounds/*` | Local background images. User data, git-ignored by default. |
| `public/fonts/` | Bundled canvas fonts plus optional uploaded fonts. |
| `public/fonts/fonts.json` | Uploaded font registry. User data, git-ignored by default. |
| `scripts/seed-fitlinkpro.mjs` | Example generator for programmatic showcase creation. |

Run the editor with `npm run dev` and open `http://localhost:3000`. The editor
autosaves to `projects/<slug>.json` with a short debounce.

Do not edit a project JSON while the editor has unsaved changes for that same
project. Last writer wins. Editing while the dev server is stopped, or after
the saved indicator settles, is safe.

## User Data Policy

Projects, screenshots, backgrounds, uploaded fonts, legacy project JSON, and
export archives are user data. They are intentionally ignored by git. Do not
stage them unless the user explicitly asks for a sample fixture or asset.

Ignored user paths include:

- `app-store-screenshots.json`
- `projects/*.json`
- `public/screenshots/*`
- `public/backgrounds/*`
- `public/fonts/uploaded/*`
- `public/fonts/fonts.json`
- local export folders and generated export zip files

## Project JSON Schema

```jsonc
{
  "schemaVersion": 2,
  "name": "My App",
  "appName": "My App",
  "themeId": "clean-light",
  "locales": ["en"],
  "locale": "en",
  "device": "iphone",
  "orientation": "portrait",
  "appIcon": "",
  "slidesByDevice": {
    "iphone": []
  }
}
```

Supported devices:

- `iphone`
- `ipad`
- `android`
- `android-7`
- `android-10`
- `feature-graphic`

Canvas sizes in portrait:

| Device | Canvas |
| --- | --- |
| `iphone` | `1320 x 2868` |
| `ipad` | `2064 x 2752` |
| `android` | `1080 x 1920` |
| `android-7` | `1200 x 1920` |
| `android-10` | `1600 x 2560` |
| `feature-graphic` | `1024 x 500` |

## Slide Schema

```jsonc
{
  "id": "s_example",
  "layout": "device-bottom",
  "screenshot": "/screenshots/myapp/{locale}/home.png",
  "screenshotSecondary": "",
  "screenshotByLocale": { "ru": "/screenshots/uploaded/abc123.png" },
  "screenshotSecondaryByLocale": {},
  "inverted": false,
  "background": { "type": "theme" },
  "deviceShadow": {
    "enabled": true,
    "color": "#000000",
    "opacity": 0.55,
    "blur": 40,
    "offsetX": 0,
    "offsetY": 8
  },
  "frameColor": "black",
  "transforms": {
    "device": {
      "x": 261,
      "y": 888,
      "width": 798,
      "height": 1626,
      "rotation": 0,
      "zIndex": 3
    }
  },
  "elements": []
}
```

Layouts:

- `hero`
- `device-bottom`
- `device-top`
- `two-devices`
- `no-device`
- `split-landscape`
- `feature-graphic`

Screenshot paths may include `{locale}`, which is replaced at render/export
time. Missing localized text falls back to English.

`screenshotByLocale` / `screenshotSecondaryByLocale` are optional per-locale
overrides (same idea as localized text): a locale listed there shows its own
file, all other locales fall back to the shared `screenshot` path. In the
editor, editing while the primary locale (`locales[0]`) is active writes the
shared path; editing in any other locale writes only that locale's override.

## Text Element

```jsonc
{
  "id": "e_headline",
  "kind": "text",
  "text": {
    "en": "Run coaching\nfrom one app"
  },
  "fontFamily": "Inter",
  "fontSize": 110,
  "fontWeight": 700,
  "color": "#10100E",
  "align": "center",
  "lineHeight": 1.05,
  "letterSpacing": 0,
  "textTransform": "uppercase",
  "opacity": 1,
  "box": {
    "color": "#FFFFFF",
    "padding": 0,
    "radius": 24
  },
  "transform": {
    "x": 78,
    "y": 218,
    "width": 1166,
    "height": 250,
    "zIndex": 5
  }
}
```

Bundled font families include Inter, Oswald, Manrope, Montserrat, Rubik,
PT Sans, and Noto Sans. All bundled fonts include Cyrillic coverage.

## Image Element

```jsonc
{
  "id": "e_badge",
  "kind": "image",
  "src": "/screenshots/myapp/{locale}/badge.png",
  "opacity": 1,
  "transform": {
    "x": 356,
    "y": 929,
    "width": 913,
    "height": 1522,
    "rotation": -6,
    "zIndex": 3
  }
}
```

Images render with object-fit contain. PNG transparency works best for stickers
and badges.

## Backgrounds

```jsonc
{ "type": "theme" }
{ "type": "solid", "color": "#0B1020" }
{
  "type": "gradient",
  "angle": 160,
  "stops": [
    { "color": "#0B1020", "position": 0 },
    { "color": "#31427A", "position": 1 }
  ]
}
{
  "type": "image",
  "src": "/backgrounds/stage.png",
  "fit": "cover",
  "blur": 0,
  "opacity": 1
}
```

Gradient and image backgrounds support panorama-style spreading across slides
through `span` and `offsetX` fields. Use the editor controls when possible so
the deck stays internally consistent.

## Creating a Showcase Programmatically

1. Copy local app screenshots into `public/screenshots/<app>/<locale>/`.
2. Write `projects/<slug>.json` using schema version 2.
3. Open the editor and switch to the project from the project menu.

For generated projects, use `scripts/seed-fitlinkpro.mjs` as a reference for
creating slides, text elements, backgrounds, and localized copy.

## Export

Users export from the UI through the `Export...` button. Export output is a
downloaded image or zip. Zip layout:

```text
<platform>/<device>/<WxH>/<locale>/NN-<layout>.<ext>
```

Chrome or another Chromium-based browser is recommended for reliable export.
Safari can be unreliable with `foreignObject` rendering.

## Development

Use these checks for code changes:

```bash
npm run build
```

There is no dedicated test suite yet. For rendered editor behavior, run the dev
server and verify the target flow in the browser.
