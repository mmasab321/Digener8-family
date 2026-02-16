"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Signup failed");
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4 py-8">
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
          <p className="text-sm text-[var(--text-muted)]">Create an account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] px-3.5 py-2.5 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
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
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-medium text-white hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-surface)] disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
