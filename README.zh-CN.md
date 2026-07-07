<h1 align="center">Screenshot Studio</h1>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ru.md">Русский</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.tr.md">Türkçe</a> ·
  <a href="README.fr.md">Français</a> ·
  <strong>简体中文</strong>
</p>

<p align="center">
  <strong>用于创建和导出 App Store 与 Google Play 截图展示图的本地可视化编辑器。</strong>
</p>

<p align="center">
  使用真实设备 mockup、可复用幻灯片模板、本地化文案、自定义字体、拖放截图和 PNG/JPG 导出，
  在不把私有应用素材上传到云端生成器的情况下制作商店截图。
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> ·
  <a href="#功能">功能</a> ·
  <a href="#本地用户数据">本地用户数据</a> ·
  <a href="#codex-skill">Codex Skill</a>
</p>

<p align="center">
  <strong>浅色主题</strong><br>
  <img src="docs/assets/screenshot-studio-light.png" alt="浅色主题下的 Screenshot Studio 编辑器，包含幻灯片缩略图、画布、设备 mockup 和幻灯片设置" width="100%">
</p>

<p align="center">
  <strong>深色主题</strong><br>
  <img src="docs/assets/screenshot-studio-dark.png" alt="深色主题下的 Screenshot Studio 编辑器，包含幻灯片缩略图、画布、设备 mockup 和幻灯片设置" width="100%">
</p>

## 为什么使用 Screenshot Studio?

Screenshot Studio 是一个本地 Web 编辑器，适合需要可重复、可编辑、可导出的应用商店截图的团队和独立开发者。
它基于 Next.js 15、React 和 Tailwind CSS 构建，项目以普通 JSON 加本地截图、背景和字体保存。

## 快速开始

### macOS

在 Finder 中双击 `start.command`。首次运行时会安装依赖，然后构建并启动本地 **production** 服务器（快速且轻量），并在浏览器中打开编辑器。重新启动是安全的：它会先停止该文件夹中之前运行的实例，因此服务器不会在新端口上不断堆积。

要停止服务器，请双击 `stop.command`（或在 `start.command` 打开的终端窗口中按 `Ctrl+C`）。

如需使用热重载进行开发，请在终端中运行 `./start.command dev`。

### Windows

在 File Explorer 中双击 `start.cmd`。首次运行时会安装依赖，然后构建并启动本地 **production** 服务器（快速且轻量），并在默认浏览器中打开编辑器。重新启动时会先停止该文件夹中之前运行的实例，因此服务器不会不断堆积。

要停止服务器，请双击 `stop.cmd`（或在 `start.cmd` 打开的命令窗口中按 `Ctrl+C`）。

如需使用热重载进行开发，请运行 `start.cmd dev`。

### 手动启动

```bash
npm install
npm run dev
```

编辑器地址:

```text
http://localhost:3000
```

如果端口 `3000` 已被占用，Next.js 会自动选择下一个可用端口。

## 功能

- **设备 mockup**: iPhone、iPad、Android phone/tablet 和 Google Play feature graphic。
- **拖放截图**: 将应用截图直接拖到设备边框中。
- **可编辑 mockup**: 调整大小、位置、旋转、图层、机身颜色和自定义阴影。
- **幻灯片背景**: 主题、纯色、渐变、图片背景，以及 cover、contain、panorama 模式。
- **自由元素**: 添加文本、图片、贴纸和 badge，并移动、缩放、旋转、复制或删除。
- **排版控制**: 字体、字号、字重、颜色、对齐、行高、字距、uppercase、透明度和文本框。
- **剪贴板模式**: 复制/粘贴带格式文本，或只粘贴文本并保留目标字段样式。
- **应用模板**: 将当前幻灯片布局应用到其余幻灯片，同时保留每张幻灯片自己的文本。
- **商店横排预览**: 将当前 deck 作为横向商店轮播图查看。
- **编辑器本地化**: UI 支持英语、俄语和日语，字典结构可继续扩展。
- **内容本地化**: 文本和截图路径支持 locale，并可使用 `{locale}` 占位符。
- **内置字体**: Inter、Oswald、Manrope、Montserrat、Rubik、PT Sans 和 Noto Sans。
- **用户字体**: 本地上传 `.ttf`、`.otf`、`.woff` 或 `.woff2`。
- **导出**: 将单张幻灯片或整个 deck 导出为 PNG/JPG，支持所选商店尺寸和 locale。
- **Undo/redo**: 使用 `Cmd+Z` 和 `Shift+Cmd+Z`。

## 本地用户数据

项目文件、上传的截图、自定义背景、上传的字体和本地导出都属于用户数据，并被 git 忽略。

被忽略的本地路径:

- `projects/*.json`
- `public/screenshots/*`
- `public/backgrounds/*`
- `public/fonts/uploaded/*`
- `public/fonts/fonts.json`
- `exports/`、`exported/`、`downloads/` 和生成的导出 zip

干净克隆会在首次启动时自动创建 `projects/default.json`。

## 项目文件

每个 showcase 项目都保存为格式化 JSON:

```text
projects/<slug>.json
```

编辑器会短延迟自动保存。如果浏览器中还有同一项目的未保存更改，请不要手动编辑该 JSON。

## 导出

导出多张幻灯片时，Screenshot Studio 会创建如下结构的 zip:

```text
<platform>/<device>/<WxH>/<locale>/NN-<layout>.<ext>
```

单张幻灯片会直接下载为图片文件。推荐使用 Chrome 或其他 Chromium 浏览器，因为 Safari 对 `foreignObject`
渲染可能不稳定。

## 本地部署

```bash
docker build -t screenshot-studio .
docker run -d -p 127.0.0.1:3000:3000 \
  -v "$PWD/projects:/app/projects" \
  -v "$PWD/public/screenshots:/app/public/screenshots" \
  -v "$PWD/public/backgrounds:/app/public/backgrounds" \
  -v "$PWD/public/fonts:/app/public/fonts" \
  screenshot-studio
```

写入 API 以 local-first 为目标。如果要对外暴露应用，请放在带认证的 reverse proxy 后面。

## 开发

```bash
npm run build
```

目前还没有专门的测试套件。主要验证方式是本地编辑器和 production build。

## Codex Skill

本仓库包含一个可复用的 Codex skill:

```text
skills/screenshot-studio
```

macOS 或 Linux 安装:

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

如果无法创建 junction，请复制文件夹:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills"
Copy-Item -Recurse -Force ".\skills\screenshot-studio" "$env:USERPROFILE\.codex\skills\"
```

安装后重启 Codex 或打开新的 thread。之后可以让 Codex 使用 `$screenshot-studio` 创建或编辑 showcase。
