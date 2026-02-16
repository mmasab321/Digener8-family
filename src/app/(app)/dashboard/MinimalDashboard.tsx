"use client";

import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MessageSquare, MoreHorizontal } from "lucide-react";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: Date | null;
  updatedAt: Date;
  assignedTo: { name: string | null; email: string } | null;
};

type Channel = {
  id: string;
  name: string;
  slug: string | null;
  lastActivityAt: Date;
  channelCategory: { name: string } | null;
};

function TaskCard({
  task,
  variant,
}: {
  task: Task;
  variant: "overdue" | "dueToday" | "recent";
}) {
  const isUrgent = task.priority === "Urgent";
  const statusLabel =
    variant === "overdue" ? "Overdue" : variant === "dueToday" ? task.status : task.status;
  const statusColor =
    variant === "overdue"
      ? "bg-red-500/20 text-red-400"
      : task.status === "Done"
        ? "bg-emerald-500/20 text-emerald-400"
        : isUrgent
          ? "bg-amber-500/20 text-amber-400"
          : "bg-[var(--accent)]/20 text-[var(--accent)]";

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow)] hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-md)] transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex text-xs font-medium px-2 py-0.5 rounded-md shrink-0",
            statusColor
          )}
        >
          {variant === "overdue" ? "Overdue" : isUrgent ? "Urgent" : statusLabel}
        </span>
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="p-1 rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <p className="font-semibold text-[var(--text)] mt-2 line-clamp-2">{task.title}</p>
      <div className="flex items-center gap-2 mt-3 text-xs text-[var(--text-muted)]">
        <span>{task.status}</span>
        <span>·</span>
        <span>{task.deadline ? formatDate(task.deadline) : formatDate(task.updatedAt)}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <div className="h-6 w-6 rounded-full bg-[var(--accent-muted)] flex items-center justify-center text-xs font-medium text-[var(--accent)]">
          {(task.assignedTo?.name || task.assignedTo?.email || "?").slice(0, 1).toUpperCase()}
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {task.assignedTo?.name || task.assignedTo?.email || "Unassigned"}
        </span>
      </div>
    </Link>
  );
}

function SectionHeader({
  title,
  count,
  dotColor,
  viewHref,
  viewLabel,
}: {
  title: string;
  count: number;
  dotColor: string;
  viewHref: string;
  viewLabel: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotColor)} />
        <h2 className="font-semibold text-[var(--text)]">{title}</h2>
        <span className="text-sm text-[var(--text-muted)]">{count}</span>
      </div>
      <Link
        href={viewHref}
        className="text-sm text-[var(--accent)] hover:underline font-medium"
      >
        {viewLabel}
      </Link>
    </div>
  );
}

export function MinimalDashboard({
  dueToday,
  overdue,
  recentlyUpdated,
  activeChannels,
  userId,
}: {
  dueToday: Task[];
  overdue: Task[];
  recentlyUpdated: Task[];
  activeChannels: Channel[];
  userId: string;
}) {
  return (
    <div className="space-y-8">
      {/* Board-style row: Overdue + Due today */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]">
          <SectionHeader
            title="Overdue"
            count={overdue.length}
            dotColor="bg-red-500"
            viewHref="/tasks"
            viewLabel="View all"
          />
          {overdue.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4">No overdue tasks.</p>
          ) : (
            <div className="space-y-3">
              {overdue.slice(0, 5).map((t) => (
                <TaskCard key={t.id} task={t} variant="overdue" />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]">
          <SectionHeader
            title="Due today"
            count={dueToday.length}
            dotColor="bg-amber-500"
            viewHref="/tasks"
            viewLabel="View all"
          />
          {dueToday.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4">No tasks due today.</p>
          ) : (
            <div className="space-y-3">
              {dueToday.slice(0, 5).map((t) => (
                <TaskCard key={t.id} task={t} variant="dueToday" />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recently updated */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]">
        <SectionHeader
          title="Recently updated"
          count={recentlyUpdated.length}
          dotColor="bg-[var(--accent)]"
          viewHref="/tasks"
          viewLabel="View all"
        />
        {recentlyUpdated.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-4">No recent updates.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentlyUpdated.slice(0, 8).map((t) => (
              <TaskCard key={t.id} task={t} variant="recent" />
            ))}
          </div>
        )}
      </section>

      {/* Active channels */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-emerald-500" />
            <h2 className="font-semibold text-[var(--text)]">Active channels</h2>
            <span className="text-sm text-[var(--text-muted)]">{activeChannels.length}</span>
          </div>
          <Link
            href="/communication"
            className="text-sm text-[var(--accent)] hover:underline font-medium"
          >
            Open Communication
          </Link>
        </div>
        {activeChannels.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-4">No recent channel activity.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {activeChannels.map((ch) => (
              <Link
                key={ch.id}
                href={`/communication?channel=${ch.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text)] hover:border-[var(--accent)]/50 hover:shadow-[var(--shadow-md)] transition-all"
              >
                <MessageSquare className="h-4 w-4 text-[var(--accent)] shrink-0" />
                <span className="font-medium">#{ch.name}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {formatDate(ch.lastActivityAt)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
