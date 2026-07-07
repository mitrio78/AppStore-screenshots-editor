// One-off: build projects/fitlinkpro.json from the v4 SVG storefront generator
// (FitLinkPro promotion project). Copies source screenshots, renders the v4
// background "scene" to a PNG via rsvg-convert, and transcribes the per-locale
// slide table into schema-v2 free elements.
//
//   node scripts/seed-fitlinkpro.mjs
//
// Coordinates are mapped from the v4 canvas (1290×2796) to the editor's
// iPhone canvas (1320×2868).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const SCREEN_ROOT = "/Users/dmitriy/Desktop/Develop/FitLinkPro promotion project/Карусели/ScreenMockups";
const MOCKUP_SET = "apple-iphone-15-black-mockup-10";

// v4 canvas → editor canvas
const V4 = { w: 1290, h: 2796 };
const CANVAS = { w: 1320, h: 2868 };
const SX = CANVAS.w / V4.w;
const SY = CANVAS.h / V4.h;
const rx = (v) => Math.round(v * SX);
const ry = (v) => Math.round(v * SY);

const C = {
  bg: "#F7F8F6",
  bg2: "#ECEFEA",
  ink: "#10100E",
  muted: "#666B67",
  stage: "#151514",
  stage2: "#23211E",
  line: "#D8DDD7",
  white: "#FFFFFF",
  orange: "#FF8A24",
};

// [id, screen, kicker, [headline lines], sub, [badges], mode?]
const LOCALES = {
  en: {
    folder: "EN",
    fine: "Available with subscription",
    slides: [
      ["01_cover", "clients", "Coach OS", ["Run coaching", "from one app"], "Clients, schedules, workouts and progress - built for personal trainers.", ["Trainer CRM", "Offline log", "7-day trial"], "tilt"],
      ["02_clients", "clients", "Clients", ["Clients stay", "organized"], "Profiles, notes, history and the next session are always one tap away.", ["Profiles", "History", "Remote + in-person"]],
      ["03_schedule", "schedule", "Schedule", ["Plan the week", "fast"], "Build a real coaching week without juggling notebooks and spreadsheets.", ["Apple Calendar", "Fast filters", "Session notes"]],
      ["04_training", "export", "Live log", ["Log sets", "during training"], "Track weights, reps, supersets and RPE while the session is still moving.", ["Sets", "Supersets", "RPE"]],
      ["05_client_link", "online", "Client link", ["Send plans", "in one tap"], "Connect the trainer plan with what the client actually completes.", ["Athlete Mode", "Plan vs fact", "Export"]],
      ["06_progress", "progress", "Progress", ["Prove progress", "with tonnage"], "Show training volume by muscle group, records and body metrics.", ["Tonnage", "Muscle groups", "PRs"]],
      ["07_library", "library", "Toolkit", ["Offline toolkit", "for trainers"], "Exercise library, videos, custom entries and your data in your hands.", ["Exercise library", "Videos", "Data export"]],
    ],
  },
  ru: {
    folder: "RU",
    fine: "Доступно по подписке",
    slides: [
      ["01_cover", "clients", "Система тренера", ["Веди клиентов", "как профи"], "Клиенты, расписание, тренировки и прогресс - в одном рабочем процессе.", ["CRM тренера", "Офлайн-лог", "7 дней"], "tilt"],
      ["02_clients", "clients", "Клиенты", ["Клиенты", "под контролем"], "Профили, заметки, история и ближайшее занятие всегда под рукой.", ["Профили", "История", "Онлайн + зал"]],
      ["03_schedule", "schedule", "Расписание", ["Неделя занятий", "без хаоса"], "Планируй рабочую неделю без тетрадей, таблиц и лишних действий.", ["Apple Calendar", "Фильтры", "Заметки"]],
      ["04_training", "export", "Живой лог", ["Подходы", "прямо в зале"], "Вес, повторы, суперсеты и RPE фиксируются по ходу занятия.", ["Подходы", "Суперсеты", "RPE"]],
      ["05_client_link", "online", "Связка", ["План клиенту", "в один тап"], "Режим спортсмена связывает план тренера и фактическое выполнение.", ["Режим спортсмена", "План / факт", "Экспорт"]],
      ["06_progress", "progress", "Прогресс", ["Прогресс", "в цифрах"], "Показывай объём по группам мышц, рекорды и замеры тела.", ["Тоннаж", "Группы мышц", "Рекорды"]],
      ["07_library", "library", "Инструменты", ["Офлайн-набор", "для тренера"], "База упражнений, видео, свои движения и экспорт записей.", ["База упражнений", "Видео", "Экспорт"]],
    ],
  },
  de: {
    folder: "DE",
    fine: "Mit Abo verfügbar",
    slides: [
      ["01_cover", "clients", "Coach-System", ["Coaching", "in einer App"], "Kunden, Termine, Workouts und Fortschritt - gebaut für Personal Trainer.", ["Coach CRM", "Offline-Log", "7 Tage"], "tilt"],
      ["02_clients", "clients", "Kunden", ["Kunden sauber", "organisiert"], "Profile, Notizen, Verlauf und die nächste Einheit sind sofort bereit.", ["Profile", "Verlauf", "Online + Studio"]],
      ["03_schedule", "schedule", "Planung", ["Plane die Woche", "schnell"], "Baue eine echte Coach-Woche ohne Notizbuch und Tabellenchaos.", ["Apple Kalender", "Filter", "Notizen"]],
      ["04_training", "export", "Live-Log", ["Sätze live", "erfassen"], "Gewicht, Wiederholungen, Supersätze und RPE direkt im Training.", ["Sätze", "Supersätze", "RPE"]],
      ["05_client_link", "online", "Kundenlink", ["Pläne senden", "mit einem Tipp"], "Verbinde den Trainerplan mit dem, was der Kunde wirklich macht.", ["Athletenmodus", "Plan vs. Ist", "Export"]],
      ["06_progress", "progress", "Fortschritt", ["Fortschritt", "mit Tonnage"], "Zeige Volumen nach Muskelgruppen, Rekorde und Körperwerte.", ["Tonnage", "Muskelgruppen", "Rekorde"]],
      ["07_library", "library", "Toolkit", ["Offline-Toolkit", "für Trainer"], "Übungsbibliothek, Videos, eigene Einträge und Datenexport.", ["Übungsbibliothek", "Videos", "Datenexport"]],
    ],
  },
  es: {
    folder: "ES",
    fine: "Disponible con suscripción",
    slides: [
      ["01_cover", "clients", "Sistema coach", ["Coaching", "en una app"], "Clientes, agenda, entrenos y progreso - creado para entrenadores.", ["CRM coach", "Log offline", "7 días"], "tilt"],
      ["02_clients", "clients", "Clientes", ["Clientes", "organizados"], "Perfiles, notas, historial y la próxima sesión siempre a mano.", ["Perfiles", "Historial", "Online + gym"]],
      ["03_schedule", "schedule", "Agenda", ["Planifica", "la semana"], "Crea una semana real de coaching sin libretas ni hojas de cálculo.", ["Apple Calendar", "Filtros", "Notas"]],
      ["04_training", "export", "Registro", ["Registra series", "en directo"], "Peso, repeticiones, superseries y RPE durante la sesión.", ["Series", "Superseries", "RPE"]],
      ["05_client_link", "online", "Cliente", ["Envía planes", "con un toque"], "Conecta el plan del coach con lo que el cliente completa.", ["Modo atleta", "Plan vs. hecho", "Exportar"]],
      ["06_progress", "progress", "Progreso", ["Progreso", "con tonelaje"], "Muestra volumen por músculo, récords y medidas corporales.", ["Tonelaje", "Músculos", "Récords"]],
      ["07_library", "library", "Toolkit", ["Toolkit offline", "para coaches"], "Biblioteca, videos, ejercicios propios y exportación de datos.", ["Biblioteca", "Videos", "Exportar"]],
    ],
  },
};

const LOCALE_CODES = Object.keys(LOCALES);
const SCREENS = ["clients", "schedule", "export", "online", "progress", "library"];

// ---------- 1. Copy source screenshots ----------

function copyScreens() {
  for (const code of LOCALE_CODES) {
    const srcDir = path.join(SCREEN_ROOT, LOCALES[code].folder);
    const dstDir = path.join(ROOT, "public", "screenshots", "fitlinkpro", code);
    fs.mkdirSync(dstDir, { recursive: true });
    for (const screen of SCREENS) {
      const candidates = [`${screen}.PNG`, `${screen}.png`];
      const found = candidates.find((f) => fs.existsSync(path.join(srcDir, f)));
      if (!found) throw new Error(`Missing raw screen ${code}/${screen}`);
      fs.copyFileSync(path.join(srcDir, found), path.join(dstDir, `${screen}.png`));
    }
    // Tilted hero mockup for slide 1
    const tilt = path.join(srcDir, MOCKUP_SET, "clients-left.png");
    if (!fs.existsSync(tilt)) throw new Error(`Missing tilt mockup for ${code}`);
    fs.copyFileSync(tilt, path.join(dstDir, "clients-left.png"));
  }
  console.log("Screens copied");
}

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

// ---------- 2. Render the v4 background scene (no content) ----------

function renderStage() {
  const W = V4.w;
  const H = V4.h;
  // Scene + brand lockup (identical on every slide); page number and copy are
  // live text elements on top.
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.bg}"/>
      <stop offset="1" stop-color="${C.bg2}"/>
    </linearGradient>
    <linearGradient id="stage" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.stage}"/>
      <stop offset="1" stop-color="${C.stage2}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <path d="M0 760 C250 705 440 810 640 770 C860 725 1030 690 1290 760 V2796 H0 Z" fill="url(#stage)"/>
  <path d="M0 760 C260 702 452 812 642 770 C854 728 1036 690 1290 760" fill="none" stroke="${C.orange}" stroke-opacity="0.95" stroke-width="7"/>
  <path d="M1090 0 H1290 V720 C1225 700 1160 692 1090 698 Z" fill="${C.orange}" opacity="0.08"/>
  <path d="M0 2520 C260 2465 462 2528 650 2492 C850 2452 1050 2450 1290 2528 V2796 H0 Z" fill="#FFFFFF" opacity="0.035"/>
  <g transform="translate(76 76)">
    <rect x="0" y="0" width="54" height="54" rx="15" fill="${C.orange}"/>
    <path d="M16 30 L27 18 L38 30" fill="none" stroke="${C.white}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M17 37 H38" fill="none" stroke="${C.white}" stroke-width="5" stroke-linecap="round"/>
    <text x="72" y="39" font-family="Inter" font-size="31" font-weight="850" fill="${C.ink}">FitLinkPro</text>
  </g>
</svg>`;
  const dir = path.join(ROOT, "public", "backgrounds");
  fs.mkdirSync(dir, { recursive: true });
  const svgFile = path.join(dir, "fitlinkpro-stage.svg");
  const pngFile = path.join(dir, "fitlinkpro-stage.png");
  fs.writeFileSync(svgFile, svg);
  execFileSync("rsvg-convert", ["-w", String(CANVAS.w), "-h", String(CANVAS.h), svgFile, "-o", pngFile]);
  fs.unlinkSync(svgFile);
  console.log("Stage background rendered:", pngFile);
}

// ---------- 3. Build the project JSON ----------

function localized(pick) {
  const out = {};
  for (const code of LOCALE_CODES) out[code] = pick(LOCALES[code]);
  return out;
}

// v4 paragraph wrap (max ~50 chars, 2 lines)
function wrap(text, maxChars = 50) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2).join("\n");
}

// v4 capsule width formula, widened to the largest locale so one shared
// transform fits every language.
function badgeWidth(slideIndex, badgeIndex) {
  let max = 0;
  for (const code of LOCALE_CODES) {
    const label = LOCALES[code].slides[slideIndex][5][badgeIndex];
    const fontSize = code === "de" || code === "ru" ? 27 : 28;
    max = Math.max(max, Math.ceil(label.length * fontSize * 0.55 + 58));
  }
  return max;
}

function text(id, textByLocale, opts) {
  return {
    id,
    kind: "text",
    text: textByLocale,
    fontFamily: opts.fontFamily || "Inter",
    fontSize: opts.fontSize,
    fontWeight: opts.fontWeight,
    color: opts.color,
    align: opts.align || "left",
    lineHeight: opts.lineHeight ?? 1.2,
    ...(opts.letterSpacing !== undefined ? { letterSpacing: opts.letterSpacing } : {}),
    ...(opts.textTransform ? { textTransform: opts.textTransform } : {}),
    ...(opts.opacity !== undefined ? { opacity: opts.opacity } : {}),
    ...(opts.box ? { box: opts.box } : {}),
    transform: opts.transform,
  };
}

function buildSlide(index) {
  const [id, screen, , , , badges, mode] = LOCALES.en.slides[index];
  const slideId = `s_flp_${id}`;
  const no = String(index + 1).padStart(2, "0");
  const elements = [];

  // Page number (top right), baked brand lockup lives in the background PNG.
  elements.push(
    text(`${slideId}_pageno`, localized(() => `${no}/07`), {
      fontSize: rx(28),
      fontWeight: 800,
      color: C.ink,
      align: "right",
      opacity: 0.38,
      transform: { x: CANVAS.w - rx(78) - 220, y: ry(92), width: 220, height: ry(44), zIndex: 5 },
    }),
  );

  // Kicker (small orange overline)
  elements.push(
    text(`${slideId}_kicker`, localized((l) => l.slides[index][2]), {
      fontSize: rx(29),
      fontWeight: 900,
      color: C.orange,
      transform: { x: rx(76), y: ry(192), width: rx(900), height: ry(48), zIndex: 5 },
    }),
  );

  // Headline (Oswald, the storefront's display face)
  elements.push(
    text(`${slideId}_headline`, localized((l) => l.slides[index][3].join("\n")), {
      fontFamily: "Oswald",
      fontSize: rx(108),
      fontWeight: 700,
      color: C.ink,
      lineHeight: 1.05,
      transform: { x: rx(76), y: ry(218), width: rx(1140), height: ry(250), zIndex: 5 },
    }),
  );

  // Sub paragraph (muted, pre-wrapped to the v4 measure)
  elements.push(
    text(`${slideId}_sub`, localized((l) => wrap(l.slides[index][4], l === LOCALES.de ? 48 : 50)), {
      fontSize: rx(34),
      fontWeight: 500,
      color: C.muted,
      lineHeight: 1.32,
      transform: { x: rx(76), y: ry(516), width: rx(1140), height: ry(110), zIndex: 5 },
    }),
  );

  // Badge capsules — first is "active" (ink), the rest are white pills.
  let bx = rx(76);
  badges.forEach((_, bi) => {
    const w = Math.round(badgeWidth(index, bi) * SX);
    const active = bi === 0;
    elements.push(
      text(`${slideId}_badge${bi + 1}`, localized((l) => l.slides[index][5][bi]), {
        fontSize: rx(28),
        fontWeight: 800,
        color: active ? C.white : C.ink,
        align: "center",
        lineHeight: 1,
        box: { color: active ? C.ink : C.white, padding: 0, radius: ry(29) },
        transform: { x: bx, y: ry(658), width: w, height: ry(56), zIndex: 5 },
      }),
    );
    bx += w + rx(22);
  });

  // Fine print (footer, localized)
  elements.push(
    text(`${slideId}_fine`, localized((l) => l.fine), {
      fontSize: rx(25),
      fontWeight: 700,
      color: C.white,
      opacity: 0.64,
      transform: { x: rx(76), y: ry(2688), width: rx(800), height: ry(44), zIndex: 5 },
    }),
  );

  const slide = {
    id: slideId,
    layout: mode === "tilt" ? "no-device" : "device-bottom",
    screenshot: mode === "tilt" ? "" : `/screenshots/fitlinkpro/{locale}/${screen}.png`,
    background: { type: "image", src: "/backgrounds/fitlinkpro-stage.png", fit: "cover" },
    deviceShadow: { enabled: true, color: "#000000", opacity: 0.38, blur: 34, offsetX: 0, offsetY: 31 },
    elements,
  };

  if (mode === "tilt") {
    // Pre-composed tilted device render as an image element.
    const probe = path.join(ROOT, "public", "screenshots", "fitlinkpro", "en", "clients-left.png");
    const size = pngSize(probe);
    const w = rx(892);
    elements.push({
      id: `${slideId}_phone`,
      kind: "image",
      src: "/screenshots/fitlinkpro/{locale}/clients-left.png",
      transform: { x: rx(348), y: ry(906), width: w, height: Math.round((w * size.h) / size.w), zIndex: 3 },
    });
  } else {
    // Framed raw screen in the editor's iPhone bezel, sized like v4's phone.
    const MK_RATIO = 1022 / 2082;
    const w = rx(780);
    slide.transforms = {
      device: { x: rx(255), y: ry(865), width: w, height: Math.round(w / MK_RATIO), zIndex: 3 },
    };
  }

  return slide;
}

function buildProject() {
  return {
    schemaVersion: 2,
    name: "FitLinkPro",
    appName: "FitLinkPro",
    themeId: "clean-light",
    locales: LOCALE_CODES,
    locale: "ru",
    device: "iphone",
    orientation: "portrait",
    appIcon: "",
    slidesByDevice: {
      iphone: LOCALES.en.slides.map((_, i) => buildSlide(i)),
      ipad: [],
      android: [],
      "android-7": [],
      "android-10": [],
      "feature-graphic": [],
    },
  };
}

copyScreens();
renderStage();
const project = buildProject();
const outFile = path.join(ROOT, "projects", "fitlinkpro.json");
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(project, null, 2) + "\n");
console.log("Project written:", outFile);
