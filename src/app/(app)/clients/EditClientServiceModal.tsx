"use client";

import { useState } from "react";

type ClientServiceData = {
  id: string;
  billingType: string;
  price: number | null;
  startDate: string | null;
  notes: string | null;
  status: string;
};

export function EditClientServiceModal({
  clientService,
  onClose,
  onSaved,
}: {
  clientService: ClientServiceData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [billingType, setBillingType] = useState(clientService.billingType);
  const [price, setPrice] = useState(clientService.price != null ? String(clientService.price) : "");
  const [startDate, setStartDate] = useState(clientService.startDate ? clientService.startDate.slice(0, 10) : "");
  const [notes, setNotes] = useState(clientService.notes ?? "");
  const [status, setStatus] = useState(clientService.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/client-services/${clientService.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billingType,
        price: price ? Number(price) : null,
        startDate: startDate || null,
        notes: notes.trim() || null,
        status,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to update");
      return;
    }
    onSaved();
  };

  const inputClass = "w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]";
  const labelClass = "block text-xs font-medium text-[var(--text-muted)] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">Edit Service</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className={labelClass}>Billing type</label>
            <select value={billingType} onChange={(e) => setBillingType(e.target.value)} className={inputClass}>
              <option value="One-time">One-time</option>
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Price</label>
            <input type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} placeholder="Optional" />
          </div>
          <div>
            <label className={labelClass}>Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Optional" />
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
