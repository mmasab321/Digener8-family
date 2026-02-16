"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-md)]">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative w-full max-w-[410px] h-32 mx-auto">
              <Image
                src="/logo.png"
                alt="diGener8"
                fill
                className="object-contain object-center"
                sizes="410px"
                priority
              />
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] px-3.5 py-2.5 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] px-3.5 py-2.5 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-medium text-white hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)] disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          No account?{" "}
          <Link href="/signup" className="text-[var(--accent)] hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
