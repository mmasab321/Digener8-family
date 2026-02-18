"use client";

import { useState, useEffect } from "react";

type ClientData = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  country: string | null;
  status: string;
  managerId?: string | null;
  manager: { id: string; name: string | null; email: string } | null;
  notes: string | null;
};

type User = { id: string; name: string | null; email: string };

export function EditClientModal({
  client,
  onClose,
  onSaved,
}: {
  client: ClientData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [companyName, setCompanyName] = useState(client.companyName ?? "");
  const [email, setEmail] = useState(client.email ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [website, setWebsite] = useState(client.website ?? "");
  const [country, setCountry] = useState(client.country ?? "");
  const [status, setStatus] = useState(client.status);
  const [managerId, setManagerId] = useState(client.manager?.id ?? "");
  const [notes, setNotes] = useState(client.notes ?? "");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        companyName: companyName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        country: country.trim() || null,
        status,
        managerId: managerId || null,
        notes: notes.trim() || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update client");
      return;
    }
    onSaved();
  };

  const inputClass = "w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]";
  const labelClass = "block text-xs font-medium text-[var(--text-muted)] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">Edit Client</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className={labelClass}>Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Company Name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Website</label>
              <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                <option value="Lead">Lead</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Manager</label>
              <select value={managerId} onChange={(e) => setManagerId(e.target.value)} className={inputClass}>
                <option value="">None</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={3} />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)]">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
