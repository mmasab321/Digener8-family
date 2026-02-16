"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function NewChannelForm({
  categories,
}: {
  categories: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [channelCategoryId, setChannelCategoryId] = useState(
    categories[0]?.id ?? ""
  );
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [type, setType] = useState<"normal" | "announcement">("normal");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!channelCategoryId.trim()) {
      setError("Please select a category so the channel appears in the sidebar.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        channelCategoryId: channelCategoryId.trim() || null,
        visibility,
        type,
        description: description || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to create channel");
      return;
    }
    router.push("/communication");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Channel name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. client-alpha"
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Category (required)</label>
        <select
          value={channelCategoryId}
          onChange={(e) => setChannelCategoryId(e.target.value)}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          required
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--text-muted)] mt-1">Pick a topic (e.g. Topics, Projects) so the channel appears in the sidebar.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Visibility</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as "public" | "private")}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
        >
          <option value="public">Public (all team)</option>
          <option value="private">Private (invite-only)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "normal" | "announcement")}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
        >
          <option value="normal">Normal (everyone can post)</option>
          <option value="announcement">Announcement (only Admin/Manager can post)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this channel for?"
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
        />
      </div>
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create channel"}
        </button>
        <Link
          href="/communication"
          className="rounded-lg border border-[var(--border)] px-4 py-2 font-medium text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
