"use client";

import { useState } from "react";
import { Paperclip, Loader2, ExternalLink, Image } from "lucide-react";
import { uploadAndAttachToTask, getViewUrl, formatBytes } from "@/lib/media/upload";

type Media = { id: string; fileName: string; mimeType: string; sizeBytes: number };

const ACCEPT = "image/png,image/jpeg,image/webp,video/mp4,application/pdf";

export function TaskAttachments({
  taskId,
  attachments,
  onUploaded,
}: {
  taskId: string;
  attachments: Media[];
  onUploaded: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      await uploadAndAttachToTask(file, taskId, setProgress);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const openAttachment = async (media: Media) => {
    setOpeningId(media.id);
    try {
      const url = await getViewUrl(media.id);
      window.open(url, "_blank");
    } finally {
      setOpeningId(null);
    }
  };

  const isImage = (mime: string) => /^image\//.test(mime);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-[var(--text-muted)]">Attachments</h3>
      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-2"
            >
              {isImage(m.mimeType) ? (
                <Image className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
              ) : (
                <Paperclip className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{m.fileName}</p>
                <p className="text-xs text-[var(--text-muted)]">{formatBytes(m.sizeBytes)}</p>
              </div>
              <button
                type="button"
                onClick={() => openAttachment(m)}
                disabled={openingId === m.id}
                className="shrink-0 flex items-center gap-1 px-2 py-1 text-sm text-[var(--accent)] hover:bg-[var(--accent-muted)] rounded"
              >
                {openingId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                Open
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <label className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]">
          <Paperclip className="h-4 w-4" /> Add file
          <input
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
        {uploading && (
          <span className="text-sm text-[var(--text-muted)]">
            Uploading… {progress}%
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
