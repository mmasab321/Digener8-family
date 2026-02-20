import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromWasabi } from "@/lib/storage/s3Client";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const asset = await prisma.clientAsset.findUnique({
    where: { id },
    select: { id: true, storageKey: true },
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFromWasabi(asset.storageKey);
  await prisma.clientAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
