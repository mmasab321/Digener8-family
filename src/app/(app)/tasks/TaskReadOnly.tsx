import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { getViewUrl } from "@/lib/media/upload";
import { Paperclip, ExternalLink, Loader2 } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: Date | null;
  assignedTo: { name: string | null; email: string } | null;
  category: { name: string } | null;
  attachments?: { id: string; fileName: string; mimeType: string; sizeBytes: number }[];
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskReadOnly({ task }: { task: Task }) {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const isOverdue =
    task.status !== "Done" &&
    task.deadline &&
    new Date(task.deadline) < new Date(new Date().setHours(0, 0, 0, 0));
  const attachments = task.attachments ?? [];

  const openAttachment = async (id: string) => {
    setOpeningId(id);
    try {
      const url = await getViewUrl(id);
      window.open(url, "_blank");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">{task.title}</h1>
      {task.description && (
        <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap">{task.description}</p>
      )}
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <dt className="text-[var(--text-muted)]">Status</dt>
        <dd className="text-white">{task.status}</dd>
        <dt className="text-[var(--text-muted)]">Priority</dt>
        <dd className="text-white">{task.priority}</dd>
        <dt className="text-[var(--text-muted)]">Assigned to</dt>
        <dd className="text-white">{task.assignedTo?.name || task.assignedTo?.email || "—"}</dd>
        <dt className="text-[var(--text-muted)]">Category</dt>
        <dd className="text-white">{task.category?.name ?? "—"}</dd>
        <dt className="text-[var(--text-muted)]">Deadline</dt>
        <dd className={isOverdue ? "text-red-400" : "text-white"}>
          {task.deadline ? formatDate(task.deadline) : "—"}
          {isOverdue && " (overdue)"}
        </dd>
      </dl>
      {attachments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">Attachments</h3>
          <ul className="space-y-2">
            {attachments.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2"
              >
                <Paperclip className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{m.fileName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatBytes(m.sizeBytes)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openAttachment(m.id)}
                  disabled={openingId === m.id}
                  className="shrink-0 flex items-center gap-1 px-2 py-1 text-sm text-[var(--accent)] hover:bg-[var(--accent-muted)] rounded"
                >
                  {openingId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  Open
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
