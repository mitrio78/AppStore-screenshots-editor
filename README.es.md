<h1 align="center">Screenshot Studio</h1>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ru.md">Русский</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <strong>Español</strong> ·
  <a href="README.tr.md">Türkçe</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <strong>Editor visual local para crear y exportar vitrinas de capturas para App Store y Google Play.</strong>
</p>

<p align="center">
  Diseña capturas de tienda con mockups reales, plantillas reutilizables,
  textos localizados, tipografía personalizada, carga por drag-and-drop y
  exportación PNG/JPG sin subir tus assets privados a un generador en la nube.
</p>

<p align="center">
  <a href="#inicio-rápido">Inicio rápido</a> ·
  <a href="#funciones">Funciones</a> ·
  <a href="#datos-locales-del-usuario">Datos locales</a> ·
  <a href="#codex-skill">Codex Skill</a>
</p>

<p align="center">
  <strong>Tema claro</strong><br>
  <img src="docs/assets/screenshot-studio-light.png" alt="Editor Screenshot Studio en tema claro con miniaturas, lienzo, mockup de dispositivo y ajustes del slide" width="100%">
</p>

<p align="center">
  <strong>Tema oscuro</strong><br>
  <img src="docs/assets/screenshot-studio-dark.png" alt="Editor Screenshot Studio en tema oscuro con miniaturas, lienzo, mockup de dispositivo y ajustes del slide" width="100%">
</p>

## Por qué Screenshot Studio

Screenshot Studio es un editor web local para equipos y desarrolladores independientes que necesitan
capturas de tienda repetibles, editables y listas para exportar. Está construido con Next.js 15,
React y Tailwind CSS, y guarda los proyectos como JSON junto con screenshots, fondos y fuentes locales.

## Inicio rápido

### macOS

Haz doble clic en `start.command` en Finder. El lanzador instala dependencias en el primer uso,
inicia el servidor local y abre el editor en el navegador.

Para detener el servidor, pulsa `Ctrl+C` en la terminal abierta por `start.command`.

### Windows

Haz doble clic en `start.cmd` en File Explorer. El lanzador instala dependencias en el primer uso,
inicia el servidor local y abre el editor en el navegador predeterminado.

Para detenerlo, pulsa `Ctrl+C` en la ventana abierta por `start.cmd`.

### Inicio manual

```bash
npm install
npm run dev
```

El editor estará disponible en:

```text
http://localhost:3000
```

Si el puerto `3000` está ocupado, Next.js elegirá automáticamente el siguiente puerto disponible.

## Funciones

- **Mockups de dispositivos**: iPhone, iPad, Android phone/tablet y Google Play feature graphic.
- **Drag-and-drop**: suelta una captura de la app directamente sobre el marco del dispositivo.
- **Edición del mockup**: cambia tamaño, posición, rotación, capas, color del cuerpo y sombra.
- **Fondos de slides**: temas, colores sólidos, gradientes e imágenes con modos cover, contain y panorama.
- **Elementos libres**: añade textos, imágenes, stickers y badges; muévelos, escálalos, rótalos, duplica o elimina.
- **Tipografía**: familia, tamaño, peso, color, alineación, alto de línea, espaciado, uppercase, opacidad y cajas de texto.
- **Modos de portapapeles**: copia/pega texto con formato o solo texto manteniendo el estilo del campo destino.
- **Aplicar plantilla**: aplica el layout del slide activo al resto del deck conservando los textos de cada slide.
- **Vista en fila de tienda**: revisa todo el deck como un carrusel horizontal de tienda.
- **Localización del editor**: UI en inglés, ruso y japonés; la estructura de diccionarios permite más idiomas.
- **Localización de contenido**: textos y rutas de capturas soportan locales y el placeholder `{locale}`.
- **Fuentes incluidas**: Inter, Oswald, Manrope, Montserrat, Rubik, PT Sans y Noto Sans.
- **Fuentes de usuario**: sube `.ttf`, `.otf`, `.woff` o `.woff2` localmente.
- **Exportación**: exporta un slide o todo el deck como PNG/JPG para tamaños y locales seleccionados.
- **Undo/redo**: usa `Cmd+Z` y `Shift+Cmd+Z`.

## Datos locales del usuario

Los proyectos, screenshots subidos, fondos personalizados, fuentes subidas y exportaciones locales son datos del usuario
y están ignorados por git.

Rutas locales ignoradas:

- `projects/*.json`
- `public/screenshots/*`
- `public/backgrounds/*`
- `public/fonts/uploaded/*`
- `public/fonts/fonts.json`
- `exports/`, `exported/`, `downloads/` y zips de exportación generados

Un clon limpio crea `projects/default.json` automáticamente en el primer inicio.

## Archivos de proyecto

Cada vitrina se guarda como JSON formateado:

```text
projects/<slug>.json
```

El editor guarda automáticamente con un pequeño debounce. No edites manualmente el mismo JSON mientras el navegador
tenga cambios sin guardar de ese proyecto.

## Exportación

Al exportar varios slides, Screenshot Studio crea un zip con esta estructura:

```text
<platform>/<device>/<WxH>/<locale>/NN-<layout>.<ext>
```

Un solo slide se descarga directamente como imagen. Se recomienda Chrome u otro navegador Chromium porque Safari puede
fallar con `foreignObject`.

## Despliegue local

```bash
docker build -t screenshot-studio .
docker run -d -p 127.0.0.1:3000:3000 \
  -v "$PWD/projects:/app/projects" \
  -v "$PWD/public/screenshots:/app/public/screenshots" \
  -v "$PWD/public/backgrounds:/app/public/backgrounds" \
  -v "$PWD/public/fonts:/app/public/fonts" \
  screenshot-studio
```

La API de escritura está pensada como local-first. Si expones la app fuera de tu máquina, ponla detrás de un reverse proxy con autenticación.

## Desarrollo

```bash
npm run build
```

Todavía no hay una suite de tests dedicada. Usa el editor local y el build de producción como verificación principal.

## Codex Skill

Este repositorio incluye un Codex skill reutilizable:

```text
skills/screenshot-studio
```

Instalación en macOS o Linux:

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

Si no puedes crear junctions, copia la carpeta:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills"
Copy-Item -Recurse -Force ".\skills\screenshot-studio" "$env:USERPROFILE\.codex\skills\"
```

Reinicia Codex o abre un nuevo thread. Después puedes pedirle a Codex que use `$screenshot-studio`.
