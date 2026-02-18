"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { NewBuildModal } from "./NewBuildModal";
import { EditBuildModal } from "./EditBuildModal";

type BuildType = "YOUTUBE" | "SAAS";
type BuildStatus = "PLANNING" | "ACTIVE" | "PAUSED" | "COMPLETED";

type BuildRow = {
  id: string;
  name: string;
  description: string | null;
  type: BuildType;
  status: BuildStatus;
  priority: string;
  progress: number;
  startDate: string | null;
  targetDate: string | null;
  owner: { id: string; name: string | null; email: string } | null;
  youtubeUploadTarget: string | null;
  youtubeVideosThisMonth: number | null;
  saasStage: string | null;
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "All", label: "All statuses" },
  { value: "PLANNING", label: "Planning" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
];

export function BuildsView({ canEdit }: { canEdit: boolean }) {
  const router = useRouter();
  const [builds, setBuilds] = useState<BuildRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<BuildType>("YOUTUBE");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingBuild, setEditingBuild] = useState<BuildRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchBuilds = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("type", tab);
    if (statusFilter && statusFilter !== "All") params.set("status", statusFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/builds?${params}`);
    const data = await res.json().catch(() => []);
    setBuilds(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [tab, statusFilter, search]);

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  const handleBuildCreated = () => {
    setShowNewModal(false);
    fetchBuilds();
    setToast("Build created");
    setTimeout(() => setToast(null), 3000);
  };

  const handleBuildUpdated = () => {
    setEditingBuild(null);
    fetchBuilds();
    setToast("Build updated");
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this build? This cannot be undone.")) return;
    setDeletingId(id);
    const res = await fetch(`/api/builds/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      fetchBuilds();
      setToast("Build deleted");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const statusPillClass = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-emerald-500/20 text-emerald-400";
      case "PLANNING": return "bg-amber-500/20 text-amber-400";
      case "PAUSED": return "bg-zinc-500/20 text-zinc-400";
      case "COMPLETED": return "bg-violet-500/20 text-violet-400";
      default: return "bg-[var(--bg-elevated)] text-[var(--text-muted)]";
    }
  };

  const priorityClass = (p: string) => {
    switch (p) {
      case "HIGH": return "bg-red-500/20 text-red-400";
      case "MEDIUM": return "bg-amber-500/20 text-amber-400";
      case "LOW": return "bg-[var(--bg-elevated)] text-[var(--text-muted)]";
      default: return "bg-[var(--bg-elevated)] text-[var(--text-muted)]";
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Tab switch (pill) + filters + New Build */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Pill tab switch */}
          <div className="inline-flex rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] p-1">
            <button
              type="button"
              onClick={() => setTab("YOUTUBE")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                tab === "YOUTUBE"
                  ? "bg-white text-[var(--bg-base)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              )}
            >
              YouTube
            </button>
            <button
              type="button"
              onClick={() => setTab("SAAS")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                tab === "SAAS"
                  ? "bg-white text-[var(--bg-base)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              )}
            >
              SaaS
            </button>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2">
              <Search className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
              <input
                type="text"
                placeholder="Search name or description..."
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
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                <Plus className="h-4 w-4" /> New Build
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Build cards */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading…</div>
        ) : builds.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[var(--text-muted)] mb-4">No builds yet</p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
              >
                <Plus className="h-4 w-4" /> Create your first build
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {builds.map((b) => (
              <div
                key={b.id}
                onClick={() => router.push(`/builds/${b.id}`)}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 hover:border-[var(--accent)]/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-[var(--text)] truncate flex-1">{b.name}</h3>
                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditingBuild(b); }}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--accent)]"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(b.id, e)}
                        disabled={deletingId === b.id}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", statusPillClass(b.status))}>
                    {b.status}
                  </span>
                  <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", priorityClass(b.priority))}>
                    {b.priority}
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                    <span>Progress</span>
                    <span>{b.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all"
                      style={{ width: `${b.progress}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Owner: {b.owner?.name || b.owner?.email || "—"}
                </div>
                {b.targetDate && (
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">Target: {formatDate(b.targetDate)}</div>
                )}
                {b.type === "YOUTUBE" && (
                  <div className="mt-2 pt-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                    {b.youtubeUploadTarget && <span>Target: {b.youtubeUploadTarget}</span>}
                    {b.youtubeVideosThisMonth != null && (
                      <span className="ml-2">Videos this month: {b.youtubeVideosThisMonth}</span>
                    )}
                  </div>
                )}
                {b.type === "SAAS" && b.saasStage && (
                  <div className="mt-2 pt-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                    Stage: {b.saasStage}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewModal && (
        <NewBuildModal
          defaultType={tab}
          onClose={() => setShowNewModal(false)}
          onCreated={handleBuildCreated}
        />
      )}
      {editingBuild && (
        <EditBuildModal
          build={editingBuild}
          onClose={() => setEditingBuild(null)}
          onUpdated={handleBuildUpdated}
        />
      )}
    </div>
  );
}
