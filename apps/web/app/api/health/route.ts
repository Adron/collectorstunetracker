import { ping } from "@ctt/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let db: "ok" | "unconfigured" | "error" = "unconfigured";
  if (process.env.DATABASE_URL) {
    try {
      await ping();
      db = "ok";
    } catch {
      db = "error";
    }
  }
  return Response.json({ ok: db !== "error", db, env: process.env.VERCEL_ENV ?? "local" }, { status: db === "error" ? 503 : 200 });
}
