"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { GripVertical, Calendar, User, Tag, Plus } from "lucide-react";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: Date | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
  category: { name: string; slug: string; color: string | null } | null;
};

type Column = { id: string; title: string; tasks: Task[] };

export function TasksKanban({
  columns,
  users,
  categories,
  currentUserId,
}: {
  columns: Column[];
  users: { id: string; name: string | null; email: string }[];
  categories: { id: string; name: string; slug: string }[];
  currentUserId?: string;
}) {
  const [filterUser, setFilterUser] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetColId, setDropTargetColId] = useState<string | null>(null);

  const filter = (tasks: Task[]) => {
    return tasks.filter((t) => {
      if (filterUser && t.assignedTo?.id !== filterUser) return false;
      if (filterCategory && t.category?.slug !== filterCategory) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      return true;
    });
  };

  const isOverdue = (t: Task) =>
    t.status !== "Done" && t.deadline && new Date(t.deadline) < new Date(new Date().setHours(0, 0, 0, 0));

  async function updateStatus(taskId: string, newStatus: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) window.location.reload();
  }

  function handleDragStart(e: React.DragEvent, taskId: string) {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragEnd() {
    setDraggedTaskId(null);
    setDropTargetColId(null);
  }
  function handleDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetColId(colId);
  }
  function handleDragLeave() {
    setDropTargetColId(null);
  }
  function handleDrop(e: React.DragEvent, colId: string) {
    e.preventDefault();
    setDropTargetColId(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    setDraggedTaskId(null);
    updateStatus(taskId, colId);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-1.5 text-sm text-white"
        >
          <option value="">All users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-1.5 text-sm text-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-1.5 text-sm text-white"
        >
          <option value="">All priorities</option>
          {["Low", "Medium", "High", "Urgent"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <Link
          href="/tasks/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          <Plus className="h-4 w-4" /> New task
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className={cn(
              "flex-shrink-0 w-72 rounded-xl border flex flex-col max-h-[calc(100vh-220px)] transition-colors",
              dropTargetColId === col.id ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)] bg-[var(--bg-surface)]"
            )}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="p-3 border-b border-[var(--border)]">
              <h3 className="font-medium text-white">
                {col.title}{" "}
                <span className="text-[var(--text-muted)] font-normal">
                  ({filter(col.tasks).length})
                </span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
              {filter(col.tasks).map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "rounded-lg p-3 border group cursor-grab active:cursor-grabbing",
                    isOverdue(task)
                      ? "bg-red-500/10 border-red-500/30 hover:border-red-500/50"
                      : "bg-[var(--bg-elevated)] border-transparent hover:border-[var(--border)]",
                    draggedTaskId === task.id && "opacity-50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="cursor-grab text-[var(--text-muted)] opacity-0 group-hover:opacity-100">
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="font-medium text-white hover:underline block truncate"
                        draggable={false}
                      >
                        {task.title}
                      </Link>
                      {task.assignedTo && (
                        <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          {task.assignedTo.name || task.assignedTo.email}
                        </p>
                      )}
                      {task.deadline && (
                        <p
                          className={cn(
                            "text-xs flex items-center gap-1 mt-0.5",
                            isOverdue(task) ? "text-red-400" : "text-[var(--text-muted)]"
                          )}
                        >
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.deadline)}
                          {isOverdue(task) && " (overdue)"}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded",
                            task.priority === "Urgent" && "bg-red-500/20 text-red-400",
                            task.priority === "High" && "bg-amber-500/20 text-amber-400",
                            task.priority === "Medium" && "bg-blue-500/20 text-blue-400",
                            task.priority === "Low" && "bg-[var(--border)] text-[var(--text-muted)]"
                          )}
                        >
                          {task.priority}
                        </span>
                        {task.category && (
                          <span
                            className="text-xs px-2 py-0.5 rounded bg-[var(--border)] text-[var(--text-muted)] flex items-center gap-1"
                          >
                            <Tag className="h-3 w-3" />
                            {task.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[var(--border)] flex flex-wrap gap-1">
                    {columns
                      .filter((c) => c.id !== task.status)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => updateStatus(task.id, c.id)}
                          className="text-xs text-[var(--accent)] hover:underline"
                        >
                          → {c.title}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
