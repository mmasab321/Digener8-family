"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TaskAttachments } from "./TaskAttachments";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedToId: string | null;
  categoryId: string | null;
  deadline: Date | null;
  attachments?: { id: string; fileName: string; mimeType: string; sizeBytes: number }[];
};

export function TaskForm({
  task,
  users,
  categories,
}: {
  task?: Task;
  users: { id: string; name: string | null; email: string }[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "Backlog",
    priority: task?.priority ?? "Medium",
    assignedToId: task?.assignedToId ?? "",
    categoryId: task?.categoryId ?? "",
    deadline: task?.deadline
      ? new Date(task.deadline).toISOString().slice(0, 16)
      : "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      assignedToId: form.assignedToId || null,
      categoryId: form.categoryId || null,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    };
    const url = task ? `/api/tasks/${task.id}` : "/api/tasks";
    const method = task ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to save");
      return;
    }
    router.push("/tasks");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white min-h-[100px]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          >
            {["Backlog", "To Do", "In Progress", "Review", "Done"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          >
            {["Low", "Medium", "High", "Urgent"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Assigned to</label>
          <select
            value={form.assignedToId}
            onChange={(e) => setForm((f) => ({ ...f, assignedToId: e.target.value }))}
            className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
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
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Deadline</label>
        <input
          type="datetime-local"
          value={form.deadline}
          onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
          className="w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2 text-white"
        />
      </div>
      {task && (
        <TaskAttachments
          taskId={task.id}
          attachments={task.attachments ?? []}
          onUploaded={() => router.refresh()}
        />
      )}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "Saving…" : task ? "Update" : "Create"}
        </button>
        <Link
          href="/tasks"
          className="rounded-lg border border-[var(--border)] px-4 py-2 font-medium text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
