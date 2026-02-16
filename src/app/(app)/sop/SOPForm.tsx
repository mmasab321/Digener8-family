"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SOP = {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  tags: string | null;
};

export function SOPForm({
  sop,
  categories,
}: {
  sop?: SOP;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: sop?.title ?? "",
    content: sop?.content ?? "",
    categoryId: sop?.categoryId ?? "",
    tags: sop?.tags ?? "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      categoryId: form.categoryId || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
    };
    const url = sop ? `/api/sops/${sop.id}` : "/api/sops";
    const method = sop ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to save");
      return;
    }
    router.push("/sop");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Category</label>
        <select
          value={form.categoryId}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
        >
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          placeholder="onboarding, process, template"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Content</label>
        <textarea
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white min-h-[300px] font-mono text-sm"
          placeholder="Write your document here. Markdown supported."
        />
      </div>
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "Saving…" : sop ? "Update" : "Create"}
        </button>
        <Link
          href="/sop"
          className="rounded-lg border border-[var(--border)] px-4 py-2 font-medium text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
