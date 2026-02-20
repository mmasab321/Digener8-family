import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromWasabi } from "@/lib/storage/s3Client";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role ?? "";
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const media = await prisma.media.findUnique({
    where: { id },
    select: { id: true, storageKey: true, uploaderId: true, messageId: true, taskId: true },
  });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canDelete =
    media.uploaderId === userId ||
    role === "Admin" ||
    hasPermission(role, "admin:channels") ||
    (media.taskId && hasPermission(role, "manage:tasks"));
  if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await deleteFromWasabi(media.storageKey);
  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
