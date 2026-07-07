// One-off: download the bundled font set (variable woff2, latin + cyrillic
// subsets) from Google Fonts into public/fonts/ and write the manifest that
// src/lib/fonts.ts imports. Re-run to refresh:  node scripts/fetch-fonts.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const FAMILIES = [
  { family: "Inter", axis: "wght@100..900" },
  { family: "Oswald", axis: "wght@200..700" },
  { family: "Manrope", axis: "wght@200..800" },
  { family: "Montserrat", axis: "wght@100..900" },
  { family: "Rubik", axis: "wght@300..900" },
  { family: "PT Sans", axis: "wght@400;700" },
  { family: "Noto Sans", axis: "wght@100..900" },
];
const SUBSETS = new Set(["latin", "latin-ext", "cyrillic", "cyrillic-ext"]);
// A modern-Chrome UA makes Google serve variable woff2 files.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const outDir = path.join(process.cwd(), "public", "fonts");
await mkdir(outDir, { recursive: true });

const manifest = [];

for (const { family, axis } of FAMILIES) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:${axis}&display=swap`;
  const css = await (await fetch(url, { headers: { "user-agent": UA } })).text();

  // Parse blocks: /* subset */ @font-face { ... font-weight: W; src: url(U) ...; unicode-range: R; }
  const blockRe = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
  let m;
  let count = 0;
  while ((m = blockRe.exec(css))) {
    const subset = m[1];
    if (!SUBSETS.has(subset)) continue;
    const body = m[2];
    const src = /url\((https:[^)]+\.woff2)\)/.exec(body)?.[1];
    const weight = /font-weight:\s*([^;]+);/.exec(body)?.[1]?.trim();
    const range = /unicode-range:\s*([^;]+);/.exec(body)?.[1]?.trim();
    const style = /font-style:\s*([^;]+);/.exec(body)?.[1]?.trim() || "normal";
    if (!src || !weight) continue;
    const slug = family.toLowerCase().replace(/ /g, "-");
    const wSlug = weight.replace(/\s+/g, "-");
    const filename = `${slug}-${wSlug}-${subset}.woff2`;
    const bytes = Buffer.from(await (await fetch(src, { headers: { "user-agent": UA } })).arrayBuffer());
    await writeFile(path.join(outDir, filename), bytes);
    manifest.push({
      family,
      file: `/fonts/${filename}`,
      weight,
      style,
      unicodeRange: range,
    });
    count += 1;
  }
  console.log(`${family}: ${count} files`);
}

const manifestPath = path.join(process.cwd(), "src", "lib", "builtin-fonts.json");
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${manifest.length} entries to ${manifestPath}`);
