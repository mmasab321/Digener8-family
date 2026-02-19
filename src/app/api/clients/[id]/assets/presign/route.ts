import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client, WASABI_BUCKET } from "@/lib/storage/s3Client";
import { UPLOAD_MAX_BYTES, isAllowedMimeForClientAsset } from "@/lib/storage/config";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin" && role !== "Manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "application/octet-stream";
  const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : parseInt(String(body.sizeBytes), 10);

  if (!fileName) return NextResponse.json({ error: "fileName required" }, { status: 400 });
  if (Number.isNaN(sizeBytes) || sizeBytes < 0) return NextResponse.json({ error: "sizeBytes required" }, { status: 400 });
  if (sizeBytes > UPLOAD_MAX_BYTES) return NextResponse.json({ error: `File too large. Max ${UPLOAD_MAX_BYTES / 1024 / 1024}MB` }, { status: 400 });
  if (!isAllowedMimeForClientAsset(mimeType)) return NextResponse.json({ error: "File type not allowed for client assets" }, { status: 400 });

  if (!WASABI_BUCKET) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const safe = sanitizeFileName(fileName);
  const storageKey = `clients/${clientId}/${Date.now()}-${safe}`;

  const command = new PutObjectCommand({
    Bucket: WASABI_BUCKET,
    Key: storageKey,
    ContentType: mimeType,
    CacheControl: "private, max-age=31536000",
  });

  let uploadUrl: string;
  try {
    uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
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
