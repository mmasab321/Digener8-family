"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { BookOpen } from "lucide-react";

type SOP = {
  id: string;
  title: string;
  content: string;
  tags: string | null;
  updatedAt: Date;
  category: { name: string } | null;
  author: { name: string | null; email: string } | null;
};

export function SOPList({
  initialSops,
  categories,
}: {
  initialSops: SOP[];
  categories: { id: string; name: string; slug: string }[];
}) {
  const [sops, setSops] = useState<SOP[]>(initialSops);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryId) params.set("categoryId", categoryId);
    fetch(`/api/sops?${params}`)
      .then((r) => r.json())
      .then((data) => setSops(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [q, categoryId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search SOPs…"
            className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] pl-9 pr-3 py-2 text-white placeholder:text-gray-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <BookOpen className="h-4 w-4" />
          </span>
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                Title
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                Category
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                Author
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {sops.map((s) => (
              <tr
                key={s.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)]"
              >
                <td className="py-3 px-4">
                  <Link href={`/sop/${s.id}`} className="font-medium text-white hover:underline">
                    {s.title}
                  </Link>
                  {s.tags && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {s.tags.split(",").map((t) => t.trim()).filter(Boolean).join(", ")}
                    </p>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                  {s.category?.name ?? "—"}
                </td>
                <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                  {s.author?.name || s.author?.email || "—"}
                </td>
                <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                  {formatDate(s.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sops.length === 0 && (
        <p className="text-center text-[var(--text-muted)] py-8">No documents found.</p>
      )}
    </div>
  );
}
