"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, GitBranch, User, DollarSign } from "lucide-react";

type Pipeline = {
  id: string;
  name: string;
  description: string | null;
  category: { name: string } | null;
  stages: {
    id: string;
    name: string;
    order: number;
    items: {
      id: string;
      title: string;
      value: number | null;
      assignedTo: { name: string | null; email: string } | null;
      category: { name: string } | null;
    }[];
  }[];
};

export function PipelineView({
  pipelines,
  users,
  categories,
  isAdmin,
}: {
  pipelines: Pipeline[];
  users: { id: string; name: string | null; email: string }[];
  categories: { id: string; name: string; slug: string }[];
  isAdmin: boolean;
}) {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(
    pipelines[0]?.id ?? ""
  );
  const [showNewPipeline, setShowNewPipeline] = useState(false);

  const pipeline = pipelines.find((p) => p.id === selectedPipelineId);

  async function moveItem(itemId: string, newStageId: string) {
    await fetch(`/api/pipelines/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: newStageId }),
    });
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedPipelineId}
          onChange={(e) => setSelectedPipelineId(e.target.value)}
          className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
        >
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowNewPipeline(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" /> New pipeline
          </button>
        )}
      </div>

      {showNewPipeline && isAdmin && (
        <NewPipelineForm
          categories={categories}
          onClose={() => setShowNewPipeline(false)}
          onSaved={() => {
            setShowNewPipeline(false);
            window.location.reload();
          }}
        />
      )}

      {!pipeline && pipelines.length === 0 && (
        <p className="text-[var(--text-muted)] py-8">
          No pipelines yet. {isAdmin && "Create one above."}
        </p>
      )}

      {pipeline && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipeline.stages.map((stage) => (
            <div
              key={stage.id}
              className="flex-shrink-0 w-72 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] flex flex-col max-h-[calc(100vh-220px)]"
            >
              <div className="p-3 border-b border-[var(--border)]">
                <h3 className="font-medium text-white">
                  {stage.name}{" "}
                  <span className="text-[var(--text-muted)]">({stage.items.length})</span>
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {stage.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg bg-[var(--bg-elevated)] p-3 border border-transparent hover:border-[var(--border)]"
                  >
                    <p className="font-medium text-white truncate">{item.title}</p>
                    {item.assignedTo && (
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {item.assignedTo.name || item.assignedTo.email}
                      </p>
                    )}
                    {item.value != null && (
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                        <DollarSign className="h-3 w-3" />
                        ${item.value.toLocaleString()}
                      </p>
                    )}
                    {item.category && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {item.category.name}
                      </p>
                    )}
                    <div className="mt-2 pt-2 border-t border-[var(--border)] flex flex-wrap gap-1">
                      {pipeline.stages
                        .filter((s) => s.id !== stage.id)
                        .map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => moveItem(item.id, s.id)}
                            className="text-xs text-[var(--accent)] hover:underline"
                          >
                            → {s.name}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-[var(--border)]">
                <NewPipelineItemButton
                  pipelineId={pipeline.id}
                  stageId={stage.id}
                  users={users}
                  categories={categories}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewPipelineForm({
  categories,
  onClose,
  onSaved,
}: {
  categories: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stagesText, setStagesText] = useState("New, In Progress, Done");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const stages = stagesText.split(",").map((s) => s.trim()).filter(Boolean);
    const res = await fetch("/api/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        categoryId: categoryId || null,
        stages: stages.length ? stages : ["New", "In Progress", "Done"],
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Failed");
      return;
    }
    onSaved();
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-4"
    >
      <h3 className="font-semibold text-white">New pipeline</h3>
      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-1">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
        >
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-[var(--text-muted)] mb-1">
          Stages (comma-separated)
        </label>
        <input
          type="text"
          value={stagesText}
          onChange={(e) => setStagesText(e.target.value)}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          placeholder="Cold, Contacted, Meeting, Closed"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)]">
          Cancel
        </button>
      </div>
    </form>
  );
}

function NewPipelineItemButton({
  pipelineId,
  stageId,
  users,
  categories,
}: {
  pipelineId: string;
  stageId: string;
  users: { id: string; name: string | null; email: string }[];
  categories: { id: string; name: string; slug: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/pipelines/${pipelineId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stageId,
        title,
        assignedToId: assignedToId || null,
        value: value === "" ? null : Number(value),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Failed");
      return;
    }
    setTitle("");
    setAssignedToId("");
    setValue("");
    setOpen(false);
    window.location.reload();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-[var(--border)] py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] flex items-center justify-center gap-1"
      >
        <Plus className="h-4 w-4" /> Add item
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white text-sm"
        required
      />
      <select
        value={assignedToId}
        onChange={(e) => setAssignedToId(e.target.value)}
        className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-1.5 text-white text-sm"
      >
        <option value="">Unassigned</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name || u.email}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Value (optional)"
        className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-1.5 text-white text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Add
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-[var(--text-muted)]">
          Cancel
        </button>
      </div>
    </form>
  );
}
