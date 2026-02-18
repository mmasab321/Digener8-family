"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { NewClientModal } from "./NewClientModal";

const STATUS_OPTIONS = ["All", "Lead", "Onboarding", "Active", "Paused", "Completed"];

type ClientRow = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  status: string;
  manager: { id: string; name: string | null; email: string } | null;
  services: { service: { id: string; name: string } }[];
  createdAt: string;
};

export function ClientsView({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showNewModal, setShowNewModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter && statusFilter !== "All") params.set("status", statusFilter);
    const res = await fetch(`/api/clients?${params}`);
    const data = await res.json().catch(() => []);
    setClients(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleClientCreated = () => {
    setShowNewModal(false);
    fetchClients();
    setToast("Client onboarded");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Top row: search, status, New Client */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2">
            <Search className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              placeholder="Search by name, company, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              <Plus className="h-4 w-4" /> New Client
            </button>
          )}
        </div>
      </div>

      {/* List card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading…</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[var(--text-muted)] mb-4">No clients yet</p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                <Plus className="h-4 w-4" /> Add your first client
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Services</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Manager</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">Created</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/clients/${c.id}`)}
                    className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text)]">{c.name}</div>
                      {c.companyName && (
                        <div className="text-xs text-[var(--text-muted)]">{c.companyName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          c.status === "Active" && "bg-emerald-500/20 text-emerald-400",
                          c.status === "Onboarding" && "bg-amber-500/20 text-amber-400",
                          c.status === "Lead" && "bg-sky-500/20 text-sky-400",
                          c.status === "Paused" && "bg-zinc-500/20 text-zinc-400",
                          c.status === "Completed" && "bg-violet-500/20 text-violet-400",
                          !["Active", "Onboarding", "Lead", "Paused", "Completed"].includes(c.status) && "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.services.slice(0, 3).map((cs) => (
                          <span
                            key={cs.service.id}
                            className="rounded-md bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-muted)]"
                          >
                            {cs.service.name}
                          </span>
                        ))}
                        {c.services.length > 3 && (
                          <span className="text-xs text-[var(--text-muted)]">+{c.services.length - 3} more</span>
                        )}
                        {c.services.length === 0 && (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {c.manager?.name || c.manager?.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNewModal && (
        <NewClientModal onClose={() => setShowNewModal(false)} onCreated={handleClientCreated} />
      )}
    </div>
  );
}
