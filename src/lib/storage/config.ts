const allowedMimeEnv = process.env.UPLOAD_ALLOWED_MIME ?? "image/png,image/jpeg,image/webp,video/mp4,application/pdf";
const maxBytes = parseInt(process.env.UPLOAD_MAX_BYTES ?? "524288000", 10); // 500MB

export const UPLOAD_MAX_BYTES = Number.isNaN(maxBytes) ? 524288000 : maxBytes;
export const UPLOAD_ALLOWED_MIME = new Set(
  allowedMimeEnv.split(",").map((s) => s.trim()).filter(Boolean)
);

export function isAllowedMime(mime: string): boolean {
  return UPLOAD_ALLOWED_MIME.has(mime);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
