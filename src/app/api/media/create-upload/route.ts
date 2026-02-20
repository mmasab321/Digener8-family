import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authOptions } from "@/lib/auth";
import { s3Client, WASABI_BUCKET } from "@/lib/storage/s3Client";
import { UPLOAD_MAX_BYTES, isAllowedMime } from "@/lib/storage/config";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file";
}

const ALLOWED_FOLDERS = ["uploads", "client-assets"] as const;

function buildStorageKey(userId: string, fileName: string, folder: "uploads" | "client-assets" = "uploads"): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const safe = sanitizeFileName(fileName);
  return `${folder}/${userId}/${yyyy}/${mm}/${suffix}-${safe}`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { fileName, mimeType, sizeBytes, attachTo, folder: folderParam } = body;
  const folder =
    ALLOWED_FOLDERS.includes(folderParam) ? folderParam : "uploads";

  if (!fileName || typeof fileName !== "string")
    return NextResponse.json({ error: "fileName required" }, { status: 400 });
  if (!mimeType || typeof mimeType !== "string")
    return NextResponse.json({ error: "mimeType required" }, { status: 400 });
  const size = typeof sizeBytes === "number" ? sizeBytes : parseInt(String(sizeBytes), 10);
  if (Number.isNaN(size) || size < 0)
    return NextResponse.json({ error: "sizeBytes required" }, { status: 400 });
  if (size > UPLOAD_MAX_BYTES)
    return NextResponse.json(
      { error: `File too large. Max ${UPLOAD_MAX_BYTES / 1024 / 1024}MB` },
      { status: 400 }
    );
  if (!isAllowedMime(mimeType))
    return NextResponse.json(
      { error: "File type not allowed. Allowed: images (png, jpeg, webp), video/mp4, PDF." },
      { status: 400 }
    );

  if (!WASABI_BUCKET)
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const storageKey = buildStorageKey(userId, fileName, folder);

  const command = new PutObjectCommand({
    Bucket: WASABI_BUCKET,
    Key: storageKey,
    ContentType: mimeType,
    CacheControl: "private, max-age=31536000",
  });

  let uploadUrl: string;
  try {
    uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min
  } catch (e) {
    console.error("Presign error:", e);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }

  return NextResponse.json({
    storageKey,
    uploadUrl,
    headers: { "Content-Type": mimeType },
  });
}
