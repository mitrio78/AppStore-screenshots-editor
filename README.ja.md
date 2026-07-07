<h1 align="center">Screenshot Studio</h1>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ru.md">Русский</a> ·
  <strong>日本語</strong> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.tr.md">Türkçe</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <strong>App Store と Google Play 向けスクリーンショットをローカルで作成、編集、書き出しできるビジュアルエディター。</strong>
</p>

<p align="center">
  実機風モックアップ、再利用できるスライドテンプレート、ローカライズされたコピー、
  カスタムタイポグラフィ、ドラッグ&ドロップのスクリーンショット配置、PNG/JPG 書き出しを
  クラウドへ非公開アセットを送らずに利用できます。
</p>

<p align="center">
  <a href="#クイックスタート">クイックスタート</a> ·
  <a href="#機能">機能</a> ·
  <a href="#ローカルユーザーデータ">ローカルユーザーデータ</a> ·
  <a href="#codex-skill">Codex Skill</a>
</p>

<p align="center">
  <strong>ライトテーマ</strong><br>
  <img src="docs/assets/screenshot-studio-light.png" alt="ライトテーマでスライド一覧、キャンバス、デバイスモックアップ、スライド設定を表示した Screenshot Studio エディター" width="100%">
</p>

<p align="center">
  <strong>ダークテーマ</strong><br>
  <img src="docs/assets/screenshot-studio-dark.png" alt="ダークテーマでスライド一覧、キャンバス、デバイスモックアップ、スライド設定を表示した Screenshot Studio エディター" width="100%">
</p>

## Screenshot Studio とは

Screenshot Studio は、ストア用スクリーンショットを再現性高く編集、管理、書き出ししたい
チームや個人開発者向けのローカル Web エディターです。Next.js 15、React、Tailwind CSS で
構築されており、プロジェクトはプレーン JSON とローカルのスクリーンショット、背景、フォントで保存されます。

## クイックスタート

### macOS

Finder で `start.command` をダブルクリックします。初回起動時に依存関係をインストールし、
その後ローカルの **production** サーバー（高速かつ軽量）をビルドして起動し、ブラウザーで
エディターを開きます。再起動しても安全です。まずこのフォルダーの以前のインスタンスを
停止するため、新しいポートにサーバーが積み重なることはありません。

サーバーを停止するには、`stop.command` をダブルクリックします（または `start.command` が
開いたターミナルで `Ctrl+C` を押します）。

ホットリロードを使った開発には、ターミナルから `./start.command dev` を実行します。

### Windows

File Explorer で `start.cmd` をダブルクリックします。初回起動時に依存関係をインストールし、
その後ローカルの **production** サーバー（高速かつ軽量）をビルドして起動し、既定の
ブラウザーでエディターを開きます。再起動時はまずこのフォルダーの以前のインスタンスを
停止するため、サーバーが積み重なることはありません。

サーバーを停止するには、`stop.cmd` をダブルクリックします（または `start.cmd` が開いた
コマンドウィンドウで `Ctrl+C` を押します）。

ホットリロードを使った開発には、`start.cmd dev` を実行します。

### 手動起動

```bash
npm install
npm run dev
```

エディターは次の URL で起動します。

```text
http://localhost:3000
```

ポート `3000` が使用中の場合、Next.js が次の空きポートを自動的に選びます。

## 機能

- **デバイスモックアップ**: iPhone、iPad、Android phone/tablet、Google Play feature graphic。
- **ドラッグ&ドロップ**: アプリのスクリーンショットをデバイスフレームへ直接配置。
- **モックアップ編集**: サイズ、位置、回転、レイヤー、ボディカラー、カスタムシャドウを調整。
- **スライド背景**: テーマ、単色、グラデーション、画像背景、cover/contain/panorama モード。
- **自由要素**: テキストフィールド、画像、ステッカー、バッジを追加、移動、拡大縮小、回転、複製、削除。
- **タイポグラフィ**: フォント、サイズ、ウェイト、色、配置、行間、文字間隔、uppercase、透明度、テキスト背景。
- **コピー/ペーストモード**: 書式付きテキスト、またはスタイルを保持したテキストのみ貼り付け。
- **テンプレート適用**: アクティブなスライドのレイアウトを他のスライドへ適用し、各スライドの本文は保持。
- **ストア行プレビュー**: 現在のデッキを横並びのストアカルーセルとして確認。
- **エディターのローカライズ**: 英語、ロシア語、日本語に対応し、辞書構造は他言語へ拡張可能。
- **コンテンツのローカライズ**: テキストとスクリーンショットパスにロケールを使用でき、`{locale}` プレースホルダーに対応。
- **組み込みフォント**: Inter、Oswald、Manrope、Montserrat、Rubik、PT Sans、Noto Sans を同梱。
- **ユーザーフォント**: `.ttf`、`.otf`、`.woff`、`.woff2` をローカルにアップロード。
- **書き出し**: 1枚またはデッキ全体を、選択したストアサイズとロケールで PNG/JPG 出力。
- **Undo/redo**: `Cmd+Z` と `Shift+Cmd+Z`。

## ローカルユーザーデータ

プロジェクトファイル、アップロードしたスクリーンショット、背景、フォント、ローカルの書き出しは
ユーザーデータとして扱われ、git から除外されます。

除外される主なパス:

- `projects/*.json`
- `public/screenshots/*`
- `public/backgrounds/*`
- `public/fonts/uploaded/*`
- `public/fonts/fonts.json`
- `exports/`、`exported/`、`downloads/`、生成された zip ファイル

クリーンなクローンでは、初回起動時に `projects/default.json` が自動作成されます。

## プロジェクトファイル

各ショーケースは整形済み JSON として保存されます。

```text
projects/<slug>.json
```

エディターは短い遅延で自動保存します。同じプロジェクトの未保存変更がブラウザーにある間は、
その JSON を手動編集しないでください。

## 書き出し

複数スライドを書き出すと、次の構造の zip が作成されます。

```text
<platform>/<device>/<WxH>/<locale>/NN-<layout>.<ext>
```

単一スライドは画像ファイルとして直接ダウンロードされます。

安定した書き出しには Chrome など Chromium ベースのブラウザーを推奨します。
Safari は `foreignObject` のレンダリングが不安定な場合があります。

## ローカルデプロイ

```bash
docker build -t screenshot-studio .
docker run -d -p 127.0.0.1:3000:3000 \
  -v "$PWD/projects:/app/projects" \
  -v "$PWD/public/screenshots:/app/public/screenshots" \
  -v "$PWD/public/backgrounds:/app/public/backgrounds" \
  -v "$PWD/public/fonts:/app/public/fonts" \
  screenshot-studio
```

書き込み API は local-first 前提です。外部公開する場合は、認証付き reverse proxy の背後に配置してください。

## 開発

```bash
npm run build
```

専用の test suite はまだありません。ローカルエディターと production build が主な検証手段です。

## Codex Skill

このリポジトリには Screenshot Studio 用の再利用可能な Codex skill が含まれています。

```text
skills/screenshot-studio
```

macOS または Linux でインストールするには、リポジトリのルートで実行します。

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

junction を作成できない場合は、フォルダーをコピーしてください。

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills"
Copy-Item -Recurse -Force ".\skills\screenshot-studio" "$env:USERPROFILE\.codex\skills\"
```

インストール後は Codex を再起動するか、新しい thread を開始してください。その後、`$screenshot-studio` を指定して
ショーケースの作成や編集を依頼できます。
