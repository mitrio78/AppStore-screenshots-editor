# Screenshot Studio Project Schema

Use this reference when editing `projects/<slug>.json` or generating showcase
projects programmatically.

## Project

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
    "iphone": [],
    "ipad": [],
    "android": [],
    "android-7": [],
    "android-10": [],
    "feature-graphic": []
  }
}
```

Theme IDs:

- `clean-light`
- `dark-bold`
- `warm-editorial`
- `ocean-fresh`

## Canvas Sizes

| Device | Portrait canvas |
| --- | --- |
| `iphone` | `1320 x 2868` |
| `ipad` | `2064 x 2752` |
| `android` | `1080 x 1920` |
| `android-7` | `1200 x 1920` |
| `android-10` | `1600 x 2560` |
| `feature-graphic` | `1024 x 500` |

All transforms are stored in canvas pixels for the active device.

## Slide

```jsonc
{
  "id": "s_example",
  "layout": "device-bottom",
  "screenshot": "/screenshots/myapp/{locale}/home.png",
  "screenshotSecondary": "",
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

`screenshotSecondary` is only used by `two-devices`.

`frameColor` is optional. When absent, the device frame uses its built-in
default look.

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
    "rotation": 0,
    "zIndex": 5
  }
}
```

Text is localized by locale code. Missing locales fall back to English.

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

Image elements render with object-fit contain. PNG transparency is best for
stickers and badges.

## Backgrounds

```jsonc
{ "type": "theme" }
```

```jsonc
{ "type": "solid", "color": "#0B1020" }
```

```jsonc
{
  "type": "gradient",
  "angle": 160,
  "stops": [
    { "color": "#0B1020", "position": 0 },
    { "color": "#31427A", "position": 1 }
  ],
  "span": 3,
  "offsetX": 0.5
}
```

```jsonc
{
  "type": "image",
  "src": "/backgrounds/stage.png",
  "fit": "cover",
  "blur": 0,
  "opacity": 1,
  "offsetX": 0
}
```

For panorama-style deck backgrounds, use the same background on multiple slides
and set `offsetX = index / (slideCount - 1)`.
