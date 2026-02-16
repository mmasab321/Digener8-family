import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runSeed } from "@/lib/seed";

/**
 * One-time seed for production when you can't use Render Shell (e.g. free tier).
 * Only runs when the database has no users. Visit: https://your-app.onrender.com/api/seed
 */
export async function GET() {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        { error: "Database already has users. Use Sign up or log in.", ok: false },
        { status: 400 }
      );
    }
    const result = await runSeed();
    return NextResponse.json(result);
  } catch (e) {
    console.error("Seed error:", e);
    const msg = e instanceof Error ? e.message : "Seed failed";
    return NextResponse.json({ error: msg, ok: false }, { status: 500 });
  }
}
