"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { EditBuildModal } from "./EditBuildModal";

type BuildType = "YOUTUBE" | "SAAS";

type ChecklistItem = {
  id: string;
  title: string;
  isDone: boolean;
  order: number;
};

type BuildData = {
  id: string;
  name: string;
  description: string | null;
  type: BuildType;
  status: string;
  priority: string;
  progress: number;
  startDate: string | null;
  targetDate: string | null;
  owner: { id: string; name: string | null; email: string } | null;
  ownerId: string | null;
  youtubeUploadTarget: string | null;
  youtubeVideosThisMonth: number | null;
  saasStage: string | null;
  checklistItems?: ChecklistItem[];
};

export function BuildDetailView({
  build: initialBuild,
  canEdit,
}: {
  build: BuildData;
  canEdit: boolean;
}) {
  const [build, setBuild] = useState<BuildData>(initialBuild);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const router = useRouter();

  const checklistItems = build.checklistItems ?? [];

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/builds/${initialBuild.id}`);
    if (res.ok) {
      const data = await res.json();
      setBuild(data);
    }
  }, [initialBuild.id]);

  useEffect(() => {
    setBuild(initialBuild);
  }, [initialBuild]);

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

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newItemTitle.trim();
    if (!title || addingItem) return;
    setAddingItem(true);
    const res = await fetch(`/api/builds/${build.id}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setAddingItem(false);
    setNewItemTitle("");
    if (res.ok) refresh();
  };

  const handleToggleChecklistItem = async (item: ChecklistItem) => {
    if (!canEdit || togglingId) return;
    setTogglingId(item.id);
    const res = await fetch(`/api/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone: !item.isDone }),
    });
    setTogglingId(null);
    if (res.ok) refresh();
  };

  const handleDeleteChecklistItem = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit || deletingItemId) return;
    setDeletingItemId(itemId);
    const res = await fetch(`/api/checklist/${itemId}`, { method: "DELETE" });
    setDeletingItemId(null);
    if (res.ok) refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">{build.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", statusPillClass(build.status))}>
                {build.status}
              </span>
              <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", priorityClass(build.priority))}>
                {build.priority}
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                Owner: {build.owner?.name || build.owner?.email || "—"}
              </span>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--bg-elevated)]"
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Delete build "${build.name}"? This cannot be undone.`)) return;
                  setDeleting(true);
                  const res = await fetch(`/api/builds/${build.id}`, { method: "DELETE" });
                  setDeleting(false);
                  if (res.ok) router.push("/builds");
                  else alert("Failed to delete build");
                }}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overview */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Overview</h2>
        {build.description && (
          <p className="text-sm text-[var(--text)] whitespace-pre-wrap mb-3">{build.description}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {build.startDate && (
            <div>
              <span className="text-[var(--text-muted)]">Start date</span>
              <p className="text-[var(--text)]">{formatDate(build.startDate)}</p>
            </div>
          )}
          {build.targetDate && (
            <div>
              <span className="text-[var(--text-muted)]">Target date</span>
              <p className="text-[var(--text)]">{formatDate(build.targetDate)}</p>
            </div>
          )}
        </div>
        {!build.description && !build.startDate && !build.targetDate && (
          <p className="text-sm text-[var(--text-muted)]">No overview details.</p>
        )}
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Progress</h2>
        <p className="text-xs text-[var(--text-muted)] mb-2">Progress is auto-calculated from checklist.</p>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[var(--text-muted)]">Progress</span>
          <span className="text-[var(--text)]">{build.progress}%</span>
        </div>
        <div className="h-3 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${build.progress}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Checklist</h2>
        <ul className="space-y-2 mb-4">
          {checklistItems.length === 0 ? (
            <li className="text-sm text-[var(--text-muted)]">No checklist items yet.</li>
          ) : (
            checklistItems.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-3 py-1.5 group",
                  item.isDone && "opacity-70"
                )}
              >
                <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.isDone}
                    onChange={() => handleToggleChecklistItem(item)}
                    disabled={!canEdit || togglingId === item.id}
                    className="rounded border-[var(--border)] text-[var(--accent)]"
                  />
                  <span className={cn("text-sm text-[var(--text)] truncate", item.isDone && "line-through text-[var(--text-muted)]")}>
                    {item.title}
                  </span>
                </label>
                {canEdit && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteChecklistItem(item.id, e)}
                    disabled={deletingItemId === item.id}
                    className="p-1.5 rounded text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
        {canEdit && (
          <form onSubmit={handleAddChecklistItem} className="flex gap-2">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Add an item..."
              className="flex-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <button
              type="submit"
              disabled={!newItemTitle.trim() || addingItem}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </form>
        )}
      </div>

      {/* Type-specific */}
      {build.type === "YOUTUBE" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">YouTube</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {build.youtubeUploadTarget && (
              <div>
                <span className="text-[var(--text-muted)]">Upload target</span>
                <p className="text-[var(--text)]">{build.youtubeUploadTarget}</p>
              </div>
            )}
            <div>
              <span className="text-[var(--text-muted)]">Videos this month</span>
              <p className="text-[var(--text)]">{build.youtubeVideosThisMonth ?? 0}</p>
            </div>
          </div>
        </div>
      )}
      {build.type === "SAAS" && build.saasStage && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">SaaS</h2>
          <div className="text-sm">
            <span className="text-[var(--text-muted)]">Stage</span>
            <p className="text-[var(--text)]">{build.saasStage}</p>
          </div>
        </div>
      )}

      {editOpen && (
        <EditBuildModal
          build={build}
          onClose={() => setEditOpen(false)}
          onUpdated={() => { setEditOpen(false); refresh(); }}
        />
      )}
    </div>
  );
}
