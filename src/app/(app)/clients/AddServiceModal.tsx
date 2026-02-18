"use client";

import { useState, useEffect } from "react";

type Service = { id: string; name: string };
type ServiceCategory = { id: string; name: string; order: number; services: Service[] };

export function AddServiceModal({
  clientId,
  existingServiceIds,
  onClose,
  onAdded,
}: {
  clientId: string;
  existingServiceIds: string[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [billingType, setBillingType] = useState("Monthly");
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const availableServices = categories.flatMap((c) => c.services).filter((s) => !existingServiceIds.includes(s.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) return;
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        billingType,
        price: price ? Number(price) : null,
        startDate: startDate || null,
        notes: notes.trim() || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to add service");
      return;
    }
    onAdded();
  };

  const inputClass = "w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]";
  const labelClass = "block text-xs font-medium text-[var(--text-muted)] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">Add Service</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {availableServices.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">All services are already assigned to this client.</p>
          ) : (
            <>
              <div>
                <label className={labelClass}>Service *</label>
                <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={inputClass} required>
                  <option value="">Select service</option>
                  {categories.sort((a, b) => a.order - b.order).map((cat) => (
                    <optgroup key={cat.id} label={cat.name}>
                      {cat.services.filter((s) => !existingServiceIds.includes(s.id)).map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Billing</label>
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
              </div>
              <div>
                <label className={labelClass}>Start date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Optional" />
              </div>
            </>
          )}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading || availableServices.length === 0}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? "Adding…" : "Add Service"}
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
