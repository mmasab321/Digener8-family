import { prisma } from "@/lib/prisma";
import { runSeed } from "@/lib/seed";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SeedPage() {
  let message: string;
  let success = false;
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      message = "Database already has users. Use Sign up or log in.";
    } else {
      const result = await runSeed();
      message = result.message;
      success = result.ok;
    }
  } catch (e) {
    message = e instanceof Error ? e.message : "Seed failed";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-4">
      <div className="max-w-md w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-center">
        <h1 className="text-xl font-semibold text-white mb-2">Database seed</h1>
        <p className={success ? "text-[var(--success)]" : "text-[var(--text-muted)]"}>{message}</p>
        {success && (
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Log in as <strong>admin@degener8.com</strong> / <strong>admin123</strong>
          </p>
        )}
        <Link
          href="/login"
          className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}
