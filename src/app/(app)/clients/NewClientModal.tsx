"use client";

import { useState, useEffect } from "react";

type User = { id: string; name: string | null; email: string };
type Service = { id: string; name: string; slug: string };
type ServiceCategory = { id: string; name: string; order: number; services: Service[] };

type SelectedService = {
  serviceId: string;
  billingType: string;
  price: string;
  startDate: string;
  notes: string;
};

export function NewClientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("Onboarding");
  const [managerId, setManagerId] = useState("");
  const [notes, setNotes] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<Record<string, SelectedService>>({});

  useEffect(() => {
    Promise.all([fetch("/api/users").then((r) => r.json()), fetch("/api/services").then((r) => r.json())]).then(
      ([usersData, catData]) => {
        setUsers(Array.isArray(usersData) ? usersData : []);
        setCategories(Array.isArray(catData) ? catData : []);
      }
    );
  }, []);

  const toggleService = (serviceId: string, serviceName: string) => {
    setSelectedServices((prev) => {
      const next = { ...prev };
      if (next[serviceId]) {
        delete next[serviceId];
        return next;
      }
      next[serviceId] = {
        serviceId,
        billingType: "Monthly",
        price: "",
        startDate: "",
        notes: "",
      };
      return next;
    });
  };

  const updateServiceOverride = (serviceId: string, field: keyof SelectedService, value: string) => {
    setSelectedServices((prev) => {
      const s = prev[serviceId];
      if (!s) return prev;
      return { ...prev, [serviceId]: { ...s, [field]: value } };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    setError(null);
    setLoading(true);
    const servicesPayload = Object.values(selectedServices).map((s) => ({
      serviceId: s.serviceId,
      billingType: s.billingType,
      price: s.price ? Number(s.price) : null,
      startDate: s.startDate || null,
      notes: s.notes || null,
    }));
    const res = await fetch("/api/clients", {
      method: "POST",
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
        services: servicesPayload,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to create client");
      return;
    }
    onCreated();
  };

  const inputClass =
    "w-full rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]";
  const labelClass = "block text-xs font-medium text-[var(--text-muted)] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">Onboard Client</h2>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${step === 1 ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-surface)] text-[var(--text-muted)]"}`}
          >
            Step 1: Client Info
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${step === 2 ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-surface)] text-[var(--text-muted)]"}`}
          >
            Step 2: Services
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className={inputClass}
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Lead">Lead</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Manager</label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">None</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={inputClass}
                  rows={3}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-muted)]">
                Select services from the catalog. Optionally set billing and price per service.
              </p>
              {categories
                .sort((a, b) => a.order - b.order)
                .map((cat) => (
                  <div key={cat.id} className="border border-[var(--border)] rounded-lg p-3">
                    <h3 className="text-sm font-medium text-[var(--text)] mb-2">{cat.name}</h3>
                    <div className="space-y-2">
                      {cat.services.map((svc) => {
                        const selected = !!selectedServices[svc.id];
                        const over = selected ? selectedServices[svc.id] : null;
                        return (
                          <div
                            key={svc.id}
                            className="rounded-lg bg-[var(--bg-surface)] p-2 space-y-2"
                          >
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleService(svc.id, svc.name)}
                                className="rounded border-[var(--border)]"
                              />
                              <span className="text-sm text-[var(--text)]">{svc.name}</span>
                            </label>
                            {selected && over && (
                              <div className="grid grid-cols-2 gap-2 pl-6 text-sm">
                                <div>
                                  <label className={labelClass}>Billing</label>
                                  <select
                                    value={over.billingType}
                                    onChange={(e) => updateServiceOverride(svc.id, "billingType", e.target.value)}
                                    className="rounded bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-1.5 text-[var(--text)] w-full"
                                  >
                                    <option value="One-time">One-time</option>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Weekly">Weekly</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={labelClass}>Price</label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={over.price}
                                    onChange={(e) => updateServiceOverride(svc.id, "price", e.target.value)}
                                    className="rounded bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-1.5 text-[var(--text)] w-full"
                                    placeholder="Optional"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className={labelClass}>Start date</label>
                                  <input
                                    type="date"
                                    value={over.startDate}
                                    onChange={(e) => updateServiceOverride(svc.id, "startDate", e.target.value)}
                                    className="rounded bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-1.5 text-[var(--text)] w-full"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className={labelClass}>Notes</label>
                                  <input
                                    type="text"
                                    value={over.notes}
                                    onChange={(e) => updateServiceOverride(svc.id, "notes", e.target.value)}
                                    className="rounded bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-1.5 text-[var(--text)] w-full"
                                    placeholder="Optional"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
            >
              Cancel
            </button>
            {step === 1 ? (
              <button
                type="submit"
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                Next: Services
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create Client"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
