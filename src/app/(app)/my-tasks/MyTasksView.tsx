"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: Date | null;
  assignedTo: { name: string | null; email: string } | null;
};

export function MyTasksView({ tasks }: { tasks: Task[] }) {
  const isOverdue = (t: Task) =>
    t.status !== "Done" && t.deadline && new Date(t.deadline) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Task</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Priority</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[var(--text-muted)]">Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr
              key={t.id}
              className={cn(
                "border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)]",
                isOverdue(t) && "bg-red-500/5"
              )}
            >
              <td className="py-3 px-4">
                <Link href={`/tasks/${t.id}`} className="font-medium text-white hover:underline">
                  {t.title}
                </Link>
              </td>
              <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{t.status}</td>
              <td className="py-3 px-4">
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded",
                    t.priority === "High" && "bg-amber-500/20 text-amber-400",
                    t.priority === "Medium" && "bg-blue-500/20 text-blue-400",
                    t.priority === "Low" && "bg-[var(--border)] text-[var(--text-muted)]"
                  )}
                >
                  {t.priority}
                </span>
              </td>
              <td className={cn("py-3 px-4 text-sm", isOverdue(t) ? "text-red-400" : "text-[var(--text-muted)]")}>
                {t.deadline ? formatDate(t.deadline) : "—"}
                {isOverdue(t) && " (overdue)"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <p className="text-center text-[var(--text-muted)] py-8">No tasks assigned to you.</p>
      )}
    </div>
  );
}
