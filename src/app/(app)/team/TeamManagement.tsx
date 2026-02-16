"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  role: { id: string; name: string };
};

export function TeamManagement({
  users,
  roles,
}: {
  users: UserRow[];
  roles: { id: string; name: string }[];
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function updateRole(userId: string, newRoleId: string) {
    await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId: newRoleId }),
    });
    window.location.reload();
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to add user");
      return;
    }
    setShowAdd(false);
    setEmail("");
    setName("");
    setPassword("");
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          <Plus className="h-4 w-4" /> Add user
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={addUser}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-4"
        >
          <h3 className="font-semibold text-white">Add user</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Adding…" : "Add user"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
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
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">User</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Role</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Joined</th>
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
                    onChange={(e) => updateRole(u.id, e.target.value)}
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
    </div>
  );
}
