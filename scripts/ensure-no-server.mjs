// prebuild guard: refuse to build while a server from THIS folder is running.
// Rebuilding .next under a live next server corrupts what it serves (API
// routes start returning 404) and leaves stale code in memory — both have
// bitten this project. Stop the server (./stop.command), then build.
// Скипается на Windows (нет lsof) и через FORCE_BUILD=1.
import { execSync } from "node:child_process";

if (process.platform === "win32" || process.env.FORCE_BUILD === "1") process.exit(0);

const repo = process.cwd();
let pids = [];
try {
  const out = execSync(
    `pgrep -f "next-server|${repo}/node_modules/.bin/next" 2>/dev/null || true`,
    { encoding: "utf8" },
  );
  for (const pid of out.split("\n").filter(Boolean)) {
    try {
      const cwd = execSync(`lsof -a -d cwd -p ${pid} -Fn 2>/dev/null | sed -n 's/^n//p' | head -1`, {
        encoding: "utf8",
      }).trim();
      if (cwd === repo) pids.push(pid);
    } catch {
      /* process may have exited */
    }
  }
} catch {
  process.exit(0); // best-effort guard only
}

if (pids.length) {
  console.error(
    `\n✋ Build blocked: a Screenshot Studio server from this folder is running (PID ${pids.join(", ")}).\n` +
      `   Rebuilding under a live server corrupts .next (API routes start 404ing).\n` +
      `   Stop it first: ./stop.command   (or FORCE_BUILD=1 to override)\n`,
  );
  process.exit(1);
}
