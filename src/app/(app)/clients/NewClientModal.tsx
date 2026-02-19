"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { formatBytes, uploadToWasabiOnly } from "@/lib/media/upload";

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

type LinkRow = { id: string; label: string; url: string };

export function NewClientModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

  const [briefText, setBriefText] = useState("");
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const router = useRouter();
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

  const addLink = () => setLinks((prev) => [...prev, { id: crypto.randomUUID(), label: "", url: "" }]);
  const removeLink = (id: string) => setLinks((prev) => prev.filter((l) => l.id !== id));
  const updateLink = (id: string, field: "label" | "url", value: string) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
    e.target.value = ""; // allow selecting same file again
  };
  const removePendingFile = (index: number) => setPendingFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
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
    const linksPayload = links.filter((l) => l.url.trim()).map((l) => ({ label: l.label.trim() || null, url: l.url.trim() }));
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
        briefText: briefText.trim() || null,
        links: linksPayload,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to create client");
      setLoading(false);
      return;
    }
    const client = await res.json();
    const clientId = client?.id;
    const totalFiles = pendingFiles.length;
    if (clientId && totalFiles > 0) {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        try {
          setUploadStatus(`Uploading ${i + 1}/${totalFiles}…`);
          const pending = await uploadToWasabiOnly(file);
          const confirmRes = await fetch(`/api/clients/${clientId}/assets/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storageKey: pending.storageKey,
              fileName: pending.fileName,
              mimeType: pending.mimeType,
              sizeBytes: pending.sizeBytes,
            }),
          });
          const confirmData = await confirmRes.json().catch(() => ({}));
          if (!confirmRes.ok) throw new Error(confirmData.error || "Save file failed");
        } catch (err) {
          setUploadStatus(null);
          setError(err instanceof Error ? err.message : "File upload failed");
          setLoading(false);
          return;
        }
      }
      setUploadStatus(null);
    }
    setLoading(false);
    onCreated();
    if (clientId) router.push(`/clients/${clientId}`);
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
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${step === 3 ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-surface)] text-[var(--text-muted)]"}`}
          >
            Step 3: Brief & Creatives
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

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Brief</label>
                <textarea
                  value={briefText}
                  onChange={(e) => setBriefText(e.target.value)}
                  className={inputClass}
                  rows={4}
                  placeholder="Client brief, goals, references..."
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass}>Reference links</label>
                  <button type="button" onClick={addLink} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline">
                    <Plus className="h-3 w-3" /> Add link
                  </button>
                </div>
                {links.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No links added.</p>
                ) : (
                  <div className="space-y-2">
                    {links.map((l) => (
                      <div key={l.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={l.label}
                          onChange={(e) => updateLink(l.id, "label", e.target.value)}
                          className="flex-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]"
                          placeholder="Label"
                        />
                        <input
                          type="url"
                          value={l.url}
                          onChange={(e) => updateLink(l.id, "url", e.target.value)}
                          className="flex-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]"
                          placeholder="https://..."
                        />
                        <button type="button" onClick={() => removeLink(l.id)} className="p-2 rounded text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass}>Files (logo, brand guide, etc.)</label>
                  {pendingFiles.length > 0 && (
                    <span className="text-xs font-medium text-[var(--accent)]">{pendingFiles.length} file(s) ready — will upload on Create Client</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.pdf,.mp4"
                  onChange={onFileSelect}
                  className="hidden"
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer?.files;
                    if (files?.length) setPendingFiles((prev) => [...prev, ...Array.from(files)]);
                  }}
                  className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 text-center cursor-pointer hover:border-[var(--accent)]/50 hover:bg-[var(--bg-elevated)]/50 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto text-[var(--text-muted)] mb-2" />
                  <p className="text-sm text-[var(--text-muted)]">Drag & drop or click to browse</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">PNG, JPEG, WebP, PDF, MP4 (same as Communication)</p>
                </div>
                {pendingFiles.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {pendingFiles.map((file, i) => (
                      <li key={i} className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-[var(--bg-elevated)]">
                        <span className="truncate text-[var(--text)]">{file.name}</span>
                        <span className="text-[var(--text-muted)] shrink-0 ml-2">{formatBytes(file.size)}</span>
                        <button type="button" onClick={() => removePendingFile(i)} className="p-1 rounded text-[var(--text-muted)] hover:text-red-400">
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
              <button type="submit" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]">
                Next: Services
              </button>
            ) : step === 2 ? (
              <button type="submit" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]">
                Next: Brief & Creatives
              </button>
            ) : (
              <button type="submit" disabled={loading} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
                {loading ? (uploadStatus || "Creating…") : "Create Client"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
