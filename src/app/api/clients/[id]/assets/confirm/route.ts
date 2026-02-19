import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UPLOAD_MAX_BYTES, isAllowedMime } from "@/lib/storage/config";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin" && role !== "Manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: clientId } = await params;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { storageKey, fileName, mimeType, sizeBytes } = body;

  if (!storageKey || typeof storageKey !== "string") return NextResponse.json({ error: "storageKey required" }, { status: 400 });
  if (!fileName || typeof fileName !== "string") return NextResponse.json({ error: "fileName required" }, { status: 400 });
  const mime = typeof mimeType === "string" ? mimeType : "application/octet-stream";
  const size = typeof sizeBytes === "number" ? sizeBytes : parseInt(String(sizeBytes), 10);
  if (Number.isNaN(size) || size < 0) return NextResponse.json({ error: "sizeBytes required" }, { status: 400 });
  if (size > UPLOAD_MAX_BYTES || !isAllowedMime(mime)) return NextResponse.json({ error: "Invalid file" }, { status: 400 });

  if (!storageKey.startsWith(`clients/${clientId}/`)) return NextResponse.json({ error: "Invalid storageKey" }, { status: 400 });

  let brief = await prisma.clientBrief.findUnique({
    where: { clientId },
    select: { id: true },
  });
  if (!brief) {
    brief = await prisma.clientBrief.create({
      data: { clientId },
      select: { id: true },
    });
  }

  const asset = await prisma.clientAsset.create({
    data: {
      briefId: brief.id,
      fileName,
      mimeType: mime,
      sizeBytes: size,
      storageKey,
      uploadedById: userId,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(asset);
}
