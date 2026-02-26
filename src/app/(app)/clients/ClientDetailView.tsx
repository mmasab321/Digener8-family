"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Download } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/media/upload";
import { EditClientModal } from "./EditClientModal";
import { EditBriefModal } from "./EditBriefModal";
import { AddServiceModal } from "./AddServiceModal";
import { EditClientServiceModal } from "./EditClientServiceModal";

type ClientServiceRow = {
  id: string;
  billingType: string;
  price: number | null;
  startDate: string | null;
  notes: string | null;
  status: string;
  service: {
    id: string;
    name: string;
    serviceCategory: { id: string; name: string; order: number } | null;
  };
};

type ClientData = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  country: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  manager: { id: string; name: string | null; email: string } | null;
  services: ClientServiceRow[];
};

type BriefAsset = {
  id: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  uploadedBy: { id: string; name: string | null; email: string } | null;
};

type BriefData = {
  id: string;
  briefText: string | null;
  links: { id: string; label: string | null; url: string }[];
  assets: BriefAsset[];
} | null;

export function ClientDetailView({
  client: initialClient,
  isAdmin,
  canEditBrief,
}: {
  client: ClientData;
  isAdmin: boolean;
  canEditBrief?: boolean;
}) {
  const [client, setClient] = useState<ClientData>(initialClient);
  const [editClientOpen, setEditClientOpen] = useState(false);
  const [editBriefOpen, setEditBriefOpen] = useState(false);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState<ClientServiceRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [brief, setBrief] = useState<BriefData>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const router = useRouter();
  const showEditBrief = canEditBrief ?? isAdmin;

  const refreshBrief = useCallback(async () => {
    const res = await fetch(`/api/clients/${initialClient.id}/brief`);
    if (res.ok) {
      const data = await res.json();
      setBrief({
        id: data?.id ?? "",
        briefText: data?.briefText ?? null,
        links: Array.isArray(data?.links) ? data.links : [],
        assets: Array.isArray(data?.assets) ? data.assets : [],
      });
    } else setBrief(null);
  }, [initialClient.id]);

  useEffect(() => {
    refreshBrief();
  }, [refreshBrief]);

  const refreshClient = useCallback(async () => {
    const res = await fetch(`/api/clients/${initialClient.id}`);
    if (res.ok) {
      const data = await res.json();
      setClient(data);
    }
  }, [initialClient.id]);

  useEffect(() => {
    setClient(initialClient);
  }, [initialClient]);

  const servicesByCategory = client.services.reduce<Record<string, { order: number; items: ClientServiceRow[] }>>((acc, cs) => {
    const catName = cs.service.serviceCategory?.name ?? "Other";
    const order = cs.service.serviceCategory?.order ?? 999;
    if (!acc[catName]) acc[catName] = { order, items: [] };
    acc[catName].items.push(cs);
    return acc;
  }, {});
  const sortedCategories = Object.entries(servicesByCategory).sort((a, b) => a[1].order - b[1].order);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">{client.name}</h1>
            {client.companyName && (
              <p className="text-sm text-[var(--text-muted)] mt-0.5">{client.companyName}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                  client.status === "Active" && "bg-emerald-500/20 text-emerald-400",
                  client.status === "Onboarding" && "bg-amber-500/20 text-amber-400",
                  client.status === "Lead" && "bg-sky-500/20 text-sky-400",
                  client.status === "Paused" && "bg-zinc-500/20 text-zinc-400",
                  client.status === "Completed" && "bg-violet-500/20 text-violet-400",
                  !["Active", "Onboarding", "Lead", "Paused", "Completed"].includes(client.status) && "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                )}
              >
                {client.status}
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                Manager: {client.manager?.name || client.manager?.email || "—"}
              </span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditClientOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg-elevated)]"
              >
                <Pencil className="h-4 w-4" /> Edit Client
              </button>
              <button
                type="button"
                onClick={() => setAddServiceOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                <Plus className="h-4 w-4" /> Add Service
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Delete client "${client.name}"? This cannot be undone.`)) return;
                  setDeleting(true);
                  const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
                  setDeleting(false);
                  if (res.ok) router.push("/clients");
                  else alert("Failed to delete client");
                }}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Delete Client
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overview */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {client.email && (
            <div>
              <span className="text-[var(--text-muted)]">Email</span>
              <p className="text-[var(--text)]">{client.email}</p>
            </div>
          )}
          {client.phone && (
            <div>
              <span className="text-[var(--text-muted)]">Phone</span>
              <p className="text-[var(--text)]">{client.phone}</p>
            </div>
          )}
          {client.website && (
            <div>
              <span className="text-[var(--text-muted)]">Website</span>
              <p className="text-[var(--text)]">
                <a href={client.website.startsWith("http") ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                  {client.website}
                </a>
              </p>
            </div>
          )}
          {client.country && (
            <div>
              <span className="text-[var(--text-muted)]">Country</span>
              <p className="text-[var(--text)]">{client.country}</p>
            </div>
          )}
        </div>
        {client.notes && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <span className="text-[var(--text-muted)] text-sm">Notes</span>
            <p className="text-[var(--text)] mt-1 whitespace-pre-wrap">{client.notes}</p>
          </div>
        )}
        {!client.email && !client.phone && !client.website && !client.country && !client.notes && (
          <p className="text-sm text-[var(--text-muted)]">No contact details or notes.</p>
        )}
      </div>

      {/* Services */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Services</h2>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setAddServiceOpen(true)}
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              + Add Service
            </button>
          )}
        </div>
        {client.services.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No services assigned.</p>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map(([catName, { items }]) => (
                <div key={catName}>
                  <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    {catName}
                  </h3>
                  <div className="space-y-2">
                    {items.map((cs) => (
                      <div
                        key={cs.id}
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-medium text-[var(--text)]">{cs.service.name}</p>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-[var(--text-muted)]">
                            <span>{cs.billingType}</span>
                            {cs.price != null && <span>${Number(cs.price).toLocaleString()}</span>}
                            {cs.startDate && <span>From {formatDate(cs.startDate)}</span>}
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 font-medium",
                                cs.status === "Active" && "bg-emerald-500/20 text-emerald-400",
                                cs.status === "Paused" && "bg-amber-500/20 text-amber-400",
                                cs.status === "Completed" && "bg-violet-500/20 text-violet-400"
                              )}
                            >
                              {cs.status}
                            </span>
                          </div>
                          {cs.notes && (
                            <p className="text-xs text-[var(--text-muted)] mt-1">{cs.notes}</p>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingService(cs)}
                              className="text-xs font-medium text-[var(--accent)] hover:underline"
                            >
                              Edit
                            </button>
                            {cs.status === "Active" && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await fetch(`/api/client-services/${cs.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "Paused" }),
                                  });
                                  refreshClient();
                                }}
                                className="text-xs font-medium text-[var(--text-muted)] hover:underline"
                              >
                                Pause
                              </button>
                            )}
                            {cs.status === "Paused" && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await fetch(`/api/client-services/${cs.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "Active" }),
                                  });
                                  refreshClient();
                                }}
                                className="text-xs font-medium text-[var(--text-muted)] hover:underline"
                              >
                                Resume
                              </button>
                            )}
                            {cs.status !== "Completed" && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await fetch(`/api/client-services/${cs.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "Completed" }),
                                  });
                                  refreshClient();
                                }}
                                className="text-xs font-medium text-[var(--text-muted)] hover:underline"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>

      {/* Brief & Creatives */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Brief & Creatives</h2>
          {showEditBrief && (
            <button
              type="button"
              onClick={() => setEditBriefOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text)]"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
          )}
        </div>
        {brief === null ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : !brief.briefText && (!brief.links || brief.links.length === 0) && (!brief.assets || brief.assets.length === 0) ? (
          <p className="text-sm text-[var(--text-muted)]">No brief, links, or files yet.</p>
        ) : (
          <div className="space-y-4">
            {brief.briefText && (
              <div>
                <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Brief</h3>
                <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{brief.briefText}</p>
              </div>
            )}
            {brief.links && brief.links.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Reference links</h3>
                <ul className="space-y-1.5">
                  {brief.links.map((l) => (
                    <li key={l.id}>
                      <a href={l.url.startsWith("http") ? l.url : `https://${l.url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline">
                        {l.label?.trim() || l.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {brief.assets && brief.assets.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Files</h3>
                <ul className="space-y-2">
                  {brief.assets.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-[var(--bg-elevated)]">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text)] truncate">{a.fileName}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {a.sizeBytes != null ? formatBytes(a.sizeBytes) : "—"} · {a.uploadedBy?.name || a.uploadedBy?.email || "—"} · {formatDate(a.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href="#"
                          onClick={async (e) => {
                            e.preventDefault();
                            const res = await fetch(`/api/client-assets/${a.id}/download`);
                            if (!res.ok) return;
                            const { url } = await res.json();
                            window.open(url, "_blank");
                          }}
                          className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10"
                        >
                          <Download className="h-4 w-4" /> Download
                        </a>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm("Delete this file?")) return;
                              setDeletingAssetId(a.id);
                              const res = await fetch(`/api/client-assets/${a.id}`, { method: "DELETE" });
                              setDeletingAssetId(null);
                              if (res.ok) refreshBrief();
                            }}
                            disabled={deletingAssetId === a.id}
                            className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Activity</h2>
        <ul className="text-sm text-[var(--text-muted)] space-y-1">
          <li>Created {formatDateTime(client.createdAt)}</li>
          <li>Updated {formatDateTime(client.updatedAt)}</li>
        </ul>
      </div>

      {editClientOpen && (
        <EditClientModal
          client={client}
          onClose={() => setEditClientOpen(false)}
          onSaved={() => {
            setEditClientOpen(false);
            refreshClient();
          }}
        />
      )}
      {editBriefOpen && (
        <EditBriefModal
          clientId={client.id}
          initialBrief={brief}
          onClose={() => setEditBriefOpen(false)}
          onSaved={() => {
            setEditBriefOpen(false);
            refreshBrief();
          }}
        />
      )}
      {addServiceOpen && (
        <AddServiceModal
          clientId={client.id}
          existingServiceIds={client.services.map((s) => s.service.id)}
          onClose={() => setAddServiceOpen(false)}
          onAdded={() => {
            setAddServiceOpen(false);
            refreshClient();
          }}
        />
      )}
      {editingService && (
        <EditClientServiceModal
          clientService={editingService}
          onClose={() => setEditingService(null)}
          onSaved={() => {
            setEditingService(null);
            refreshClient();
          }}
        />
      )}
    </div>
  );
}
