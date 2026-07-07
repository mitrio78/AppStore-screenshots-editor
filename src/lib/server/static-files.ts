// Serves files from public/ that were added AFTER the production build.
// `next start` only serves public/ assets known at build time; anything the
// app writes at runtime (uploaded screenshots, backgrounds, fonts) would 404
// after a reload. Requests for missing public files fall through to the app
// router, where the catch-all routes below hand them off to this helper.
// Build-time assets still take precedence and never reach these routes.
import { promises as fs } from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  woff2: "font/woff2",
  woff: "font/woff",
  ttf: "font/ttf",
  otf: "font/otf",
  json: "application/json",
};

export async function servePublicFile(prefix: string, segments: string[]): Promise<Response> {
  // Reject traversal outright; resolve() below is the backstop.
  if (segments.some((s) => !s || s.includes("..") || s.includes("\\"))) {
    return new Response("Bad path", { status: 400 });
  }
  const root = path.join(PUBLIC_DIR, prefix);
  const abs = path.resolve(root, ...segments);
  if (!abs.startsWith(root + path.sep)) {
    return new Response("Bad path", { status: 400 });
  }
  try {
    const bytes = await fs.readFile(abs);
    const ext = abs.split(".").pop()?.toLowerCase() || "";
    const type = MIME[ext] || "application/octet-stream";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "content-type": type,
        // Uploads are content-hashed → safe to cache hard; manifests are not.
        "cache-control": ext === "json" ? "no-store" : "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
