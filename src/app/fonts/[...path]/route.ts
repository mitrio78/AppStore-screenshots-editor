import { servePublicFile } from "@/lib/server/static-files";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

// Fallback for fonts uploaded after the production build (see static-files.ts).
export async function GET(_req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return servePublicFile("fonts", path);
}
