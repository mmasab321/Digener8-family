const allowedMimeEnv = process.env.UPLOAD_ALLOWED_MIME ?? "image/png,image/jpeg,image/webp,video/mp4,application/pdf";
const maxBytes = parseInt(process.env.UPLOAD_MAX_BYTES ?? "5368709120", 10); // 5GB

export const UPLOAD_MAX_BYTES = Number.isNaN(maxBytes) ? 5368709120 : maxBytes;
export const UPLOAD_ALLOWED_MIME = new Set(
  allowedMimeEnv.split(",").map((s) => s.trim()).filter(Boolean)
);

export function isAllowedMime(mime: string): boolean {
  return UPLOAD_ALLOWED_MIME.has(mime);
}

/** Broader list for client brief assets (creatives, brand files, etc.). */
const CLIENT_ASSET_MIME = new Set([
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "video/mp4", "video/quicktime",
  "application/pdf",
  "application/zip", "application/x-zip-compressed",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv",
  "application/octet-stream",
]);
export function isAllowedMimeForClientAsset(mime: string): boolean {
  if (!mime || mime === "application/octet-stream") return true;
  return UPLOAD_ALLOWED_MIME.has(mime) || CLIENT_ASSET_MIME.has(mime);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
