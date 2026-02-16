/**
 * Client-side flow:
 * - Task: uploadAndAttachToTask(file, taskId) -> create-upload, PUT, confirm.
 * - Message: uploadToWasabiOnly(file) -> create-upload, PUT; then on send confirmAttachment(pending, messageId).
 */
export type AttachTo = { type: "task"; id: string } | { type: "message"; id: string };

export type MediaDto = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type PendingAttachment = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

async function createUpload(
  file: File,
  attachTo: AttachTo | null
): Promise<{ uploadUrl: string; storageKey: string; headers: Record<string, string> }> {
  const res = await fetch("/api/media/create-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      ...(attachTo ? { attachTo } : {}),
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to create upload");
  }
  return res.json();
}

function putFile(
  file: File,
  uploadUrl: string,
  contentType: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

export async function confirmAttachment(
  pending: PendingAttachment,
  attachTo: AttachTo
): Promise<MediaDto> {
  const res = await fetch("/api/media/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...pending, attachTo }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to confirm upload");
  }
  return res.json();
}

/** Full flow for task: create-upload -> PUT -> confirm. Returns MediaDto. */
export async function uploadAndAttachToTask(
  file: File,
  taskId: string,
  onProgress?: (percent: number) => void
): Promise<MediaDto> {
  const attachTo: AttachTo = { type: "task", id: taskId };
  const { uploadUrl, storageKey, headers } = await createUpload(file, attachTo);
  await putFile(file, uploadUrl, headers["Content-Type"], onProgress);
  return confirmAttachment(
    { storageKey, fileName: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size },
    attachTo
  );
}

/** For chat: upload to Wasabi only; call confirmAttachment after message is created. */
export async function uploadToWasabiOnly(
  file: File,
  onProgress?: (percent: number) => void
): Promise<PendingAttachment> {
  const { uploadUrl, storageKey, headers } = await createUpload(file, null);
  await putFile(file, uploadUrl, headers["Content-Type"], onProgress);
  return {
    storageKey,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  };
}

export async function getViewUrl(mediaId: string): Promise<string> {
  const res = await fetch(`/api/media/${mediaId}/url`);
  if (!res.ok) throw new Error("Failed to get URL");
  const { url } = await res.json();
  return url;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
