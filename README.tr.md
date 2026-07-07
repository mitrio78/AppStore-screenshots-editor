<h1 align="center">Screenshot Studio</h1>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ru.md">Русский</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.es.md">Español</a> ·
  <strong>Türkçe</strong> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <strong>App Store ve Google Play ekran görüntüsü vitrinleri oluşturmak ve dışa aktarmak için yerel görsel editör.</strong>
</p>

<p align="center">
  Gerçek cihaz mockup'ları, yeniden kullanılabilir slide şablonları, yerelleştirilmiş metinler,
  özel tipografi, drag-and-drop screenshot yükleme ve PNG/JPG export ile özel app varlıklarını
  bulut araçlarına göndermeden mağaza görselleri hazırlayın.
</p>

<p align="center">
  <a href="#hızlı-başlangıç">Hızlı başlangıç</a> ·
  <a href="#özellikler">Özellikler</a> ·
  <a href="#yerel-kullanıcı-verileri">Kullanıcı verileri</a> ·
  <a href="#codex-skill">Codex Skill</a>
</p>

<p align="center">
  <strong>Açık tema</strong><br>
  <img src="docs/assets/screenshot-studio-light.png" alt="Açık temada slide listesi, canvas, cihaz mockup'ı ve slide ayarlarını gösteren Screenshot Studio editörü" width="100%">
</p>

<p align="center">
  <strong>Koyu tema</strong><br>
  <img src="docs/assets/screenshot-studio-dark.png" alt="Koyu temada slide listesi, canvas, cihaz mockup'ı ve slide ayarlarını gösteren Screenshot Studio editörü" width="100%">
</p>

## Neden Screenshot Studio?

Screenshot Studio, mağaza screenshot'larını tekrarlanabilir, düzenlenebilir ve export edilebilir şekilde hazırlamak isteyen
ekipler ve bağımsız geliştiriciler için yerel bir web editörüdür. Next.js 15, React ve Tailwind CSS ile geliştirilmiştir.
Projeler düz JSON ve yerel screenshot, arka plan ve font dosyalarıyla saklanır.

## Hızlı başlangıç

### macOS

Finder'da `start.command` dosyasına çift tıklayın. İlk çalıştırmada bağımlılıkları kurar, yerel dev server'ı başlatır ve editörü tarayıcıda açar.

Server'ı durdurmak için `start.command` tarafından açılan terminalde `Ctrl+C` basın.

### Windows

File Explorer'da `start.cmd` dosyasına çift tıklayın. İlk çalıştırmada bağımlılıkları kurar, yerel dev server'ı başlatır ve varsayılan tarayıcıda açar.

Durdurmak için `start.cmd` penceresinde `Ctrl+C` basın.

### Manuel başlatma

```bash
npm install
npm run dev
```

Editör şu adreste çalışır:

```text
http://localhost:3000
```

`3000` portu doluysa Next.js otomatik olarak sonraki uygun portu seçer.

## Özellikler

- **Cihaz mockup'ları**: iPhone, iPad, Android phone/tablet ve Google Play feature graphic.
- **Drag-and-drop screenshot**: App screenshot'ını doğrudan cihaz frame'ine bırakın.
- **Mockup yerleşimi**: Boyut, konum, rotasyon, layer, gövde rengi ve özel shadow ayarları.
- **Slide arka planları**: Temalar, düz renkler, gradientler ve cover, contain, panorama modlu görseller.
- **Serbest elementler**: Text field, image, sticker ve badge ekleyin, taşıyın, ölçekleyin, döndürün, çoğaltın veya silin.
- **Tipografi**: Font family, size, weight, color, alignment, line height, letter spacing, uppercase, opacity ve text box.
- **Clipboard modları**: Formatlı metin kopyala/yapıştır veya hedef alan stilini koruyarak yalnızca metin yapıştır.
- **Şablon uygulama**: Aktif slide layout'unu deck'in geri kalanına uygula, her slide'ın kendi metnini koru.
- **Store row preview**: Tüm deck'i yatay mağaza carousel'i olarak gör.
- **Editör yerelleştirme**: UI İngilizce, Rusça ve Japonca; sözlük yapısı daha fazla dil için hazır.
- **İçerik yerelleştirme**: Metinler ve screenshot path'leri locale destekler, `{locale}` placeholder kullanılabilir.
- **Yerleşik fontlar**: Inter, Oswald, Manrope, Montserrat, Rubik, PT Sans ve Noto Sans.
- **Kullanıcı fontları**: `.ttf`, `.otf`, `.woff`, `.woff2` dosyalarını yerel olarak yükleyin.
- **Export**: Tek slide veya tüm deck'i seçili store size ve locale'lerde PNG/JPG olarak export edin.
- **Undo/redo**: `Cmd+Z` ve `Shift+Cmd+Z`.

## Yerel kullanıcı verileri

Project dosyaları, yüklenen screenshot'lar, özel arka planlar, yüklenen fontlar ve local export'lar kullanıcı verisidir ve git tarafından ignore edilir.

Ignore edilen yollar:

- `projects/*.json`
- `public/screenshots/*`
- `public/backgrounds/*`
- `public/fonts/uploaded/*`
- `public/fonts/fonts.json`
- `exports/`, `exported/`, `downloads/` ve üretilen export zip dosyaları

Temiz clone ilk çalıştırmada otomatik olarak `projects/default.json` oluşturur.

## Project dosyaları

Her vitrin pretty-printed JSON olarak saklanır:

```text
projects/<slug>.json
```

Editör kısa bir gecikmeyle otomatik kaydeder. Tarayıcıda aynı proje için kaydedilmemiş değişiklik varsa JSON dosyasını elle düzenlemeyin.

## Export

Birden fazla slide export edildiğinde Screenshot Studio şu yapıda zip oluşturur:

```text
<platform>/<device>/<WxH>/<locale>/NN-<layout>.<ext>
```

Tek slide doğrudan image olarak indirilir. Güvenilir export için Chrome veya Chromium tabanlı tarayıcı önerilir; Safari `foreignObject` ile sorun çıkarabilir.

## Yerel deployment

```bash
docker build -t screenshot-studio .
docker run -d -p 127.0.0.1:3000:3000 \
  -v "$PWD/projects:/app/projects" \
  -v "$PWD/public/screenshots:/app/public/screenshots" \
  -v "$PWD/public/backgrounds:/app/public/backgrounds" \
  -v "$PWD/public/fonts:/app/public/fonts" \
  screenshot-studio
```

Write API local-first tasarlanmıştır. Uygulamayı dışarı açarsanız authentication olan reverse proxy arkasına koyun.

## Geliştirme

```bash
npm run build
```

Henüz ayrı bir test suite yok. Ana doğrulama yolu local editor ve production build'dir.

## Codex Skill

Bu repository, Screenshot Studio ile çalışan agent'lar için yeniden kullanılabilir bir Codex skill içerir:

```text
skills/screenshot-studio
```

macOS veya Linux kurulumu:

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

Junction kullanılamıyorsa klasörü kopyalayın:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills"
Copy-Item -Recurse -Force ".\skills\screenshot-studio" "$env:USERPROFILE\.codex\skills\"
```

Kurulumdan sonra Codex'i yeniden başlatın veya yeni bir thread açın. Ardından `$screenshot-studio` kullanmasını isteyebilirsiniz.
