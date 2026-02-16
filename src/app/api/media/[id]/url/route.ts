import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client, WASABI_BUCKET } from "@/lib/storage/s3Client";

async function canViewMedia(userId: string, role: string, media: { taskId: string | null; messageId: string | null }) {
  if (hasPermission(role, "admin:channels") || role === "Admin") return true;
  if (media.taskId) {
    const task = await prisma.task.findUnique({
      where: { id: media.taskId },
      select: { assignedToId: true },
    });
    if (!task) return false;
    if (hasPermission(role, "manage:tasks")) return true;
    return task.assignedToId === userId;
  }
  if (media.messageId) {
    const message = await prisma.message.findUnique({
      where: { id: media.messageId },
      include: { channel: { include: { members: { where: { userId } } } } },
    });
    if (!message) return false;
    if (message.senderId === userId) return true;
    if (message.channel && message.channel.members.length > 0) return true;
    return false;
  }
  return false;
}

export async function GET(
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
    select: { storageKey: true, taskId: true, messageId: true },
  });
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await canViewMedia(userId, role, media);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!WASABI_BUCKET) return NextResponse.json({ error: "Storage not configured" }, { status: 503 });

  const command = new GetObjectCommand({
    Bucket: WASABI_BUCKET,
    Key: media.storageKey,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  return NextResponse.json({ url });
}
