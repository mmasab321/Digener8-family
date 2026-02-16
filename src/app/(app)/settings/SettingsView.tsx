"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Users, Tags } from "lucide-react";

type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  role: { id: string; name: string };
};

type Role = { id: string; name: string };

type Category = { id: string; name: string; slug: string; description: string | null; color: string | null };

export function SettingsView({
  users,
  roles,
  categories,
}: {
  users: User[];
  roles: Role[];
  categories: Category[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "categories">("users");
  const [newCategory, setNewCategory] = useState(false);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [saving, setSaving] = useState(false);

  async function updateUserRole(userId: string, roleId: string) {
    const res = await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId }),
    });
    if (!res.ok) return;
    router.refresh();
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: catName,
        slug: catSlug || catName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        description: catDesc || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Failed");
      return;
    }
    setNewCategory(false);
    setCatName("");
    setCatSlug("");
    setCatDesc("");
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "users"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--text-muted)] hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Users
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("categories")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "categories"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent text-[var(--text-muted)] hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <Tags className="h-4 w-4" /> Categories
          </span>
        </button>
      </div>

      {tab === "users" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                  User
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-3 px-4">
                    <p className="font-medium text-white">{u.name || u.email}</p>
                    <p className="text-sm text-[var(--text-muted)]">{u.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role.id}
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-1.5 text-sm text-white"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setNewCategory(true)}
              className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
            >
              Add category
            </button>
          </div>
          {newCategory && (
            <form
              onSubmit={createCategory}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-4"
            >
              <h3 className="font-semibold text-white">New category</h3>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Name</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Slug (optional)</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
                  placeholder="auto from name"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">Description</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {saving ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setNewCategory(false)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                    Slug
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-3 px-4 font-medium text-white">{c.name}</td>
                    <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{c.slug}</td>
                    <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                      {c.description ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
