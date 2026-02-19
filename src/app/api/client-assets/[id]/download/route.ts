import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client, WASABI_BUCKET } from "@/lib/storage/s3Client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = await prisma.clientAsset.findUnique({
    where: { id },
    select: { id: true, storageKey: true, fileName: true, briefId: true },
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const brief = await prisma.clientBrief.findUnique({
    where: { id: asset.briefId },
    select: { clientId: true },
  });
  if (!brief) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!WASABI_BUCKET) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const command = new GetObjectCommand({
    Bucket: WASABI_BUCKET,
    Key: asset.storageKey,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  return NextResponse.json({ url, fileName: asset.fileName });
}
