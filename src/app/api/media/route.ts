import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");
  const messageId = searchParams.get("messageId");

  if (taskId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId },
      include: { attachments: true },
    });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const role = (session.user as { role?: string }).role ?? "";
    const isAdmin = role === "Admin" || role === "Manager";
    const canView = task.assignedToId === userId || isAdmin;
    if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(task.attachments);
  }

  if (messageId) {
    const message = await prisma.message.findFirst({
      where: { id: messageId },
      include: { attachments: true, channel: { include: { members: { where: { userId } } } } },
    });
    if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const inChannel = message.channel && message.channel.members.length > 0;
    const canView = message.senderId === userId || inChannel;
    if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(message.attachments);
  }

  return NextResponse.json({ error: "taskId or messageId required" }, { status: 400 });
}
