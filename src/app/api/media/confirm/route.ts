import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UPLOAD_MAX_BYTES, isAllowedMime } from "@/lib/storage/config";

async function canAttachToTask(userId: string, role: string, taskId: string): Promise<boolean> {
  if (hasPermission(role, "admin:channels") || hasPermission(role, "manage:tasks")) return true;
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { assignedToId: true },
  });
  if (!task) return false;
  return task.assignedToId === userId;
}

async function canAttachToMessage(userId: string, role: string, messageId: string): Promise<boolean> {
  if (hasPermission(role, "admin:channels") || role === "Admin") return true;
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      channel: { include: { members: { where: { userId } } } },
    },
  });
  if (!message) return false;
  if (message.senderId === userId) return true;
  if (message.channel && message.channel.members.length > 0) return true;
  return false;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role ?? "";
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { storageKey, fileName, mimeType, sizeBytes, attachTo } = body;

  if (!storageKey || typeof storageKey !== "string")
    return NextResponse.json({ error: "storageKey required" }, { status: 400 });
  if (!fileName || typeof fileName !== "string")
    return NextResponse.json({ error: "fileName required" }, { status: 400 });
  if (!mimeType || typeof mimeType !== "string")
    return NextResponse.json({ error: "mimeType required" }, { status: 400 });
  const size = typeof sizeBytes === "number" ? sizeBytes : parseInt(String(sizeBytes), 10);
  if (Number.isNaN(size) || size < 0)
    return NextResponse.json({ error: "sizeBytes required" }, { status: 400 });
  if (!attachTo || typeof attachTo !== "object" || !attachTo.type || !attachTo.id)
    return NextResponse.json({ error: "attachTo { type, id } required" }, { status: 400 });

  if (size > UPLOAD_MAX_BYTES || !isAllowedMime(mimeType))
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });

  const { type: attachType, id: attachId } = attachTo;
  if (attachType === "task") {
    const ok = await canAttachToTask(userId, role, attachId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else if (attachType === "message") {
    const ok = await canAttachToMessage(userId, role, attachId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else {
    return NextResponse.json({ error: "attachTo.type must be task or message" }, { status: 400 });
  }

  const data: {
    uploaderId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    taskId?: string | null;
    messageId?: string | null;
  } = {
    uploaderId: userId,
    fileName,
    mimeType,
    sizeBytes: size,
    storageKey,
    taskId: attachType === "task" ? attachId : null,
    messageId: attachType === "message" ? attachId : null,
  };

  const media = await prisma.media.create({
    data,
  });

  return NextResponse.json({
    id: media.id,
    fileName: media.fileName,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes,
    createdAt: media.createdAt,
  });
}
