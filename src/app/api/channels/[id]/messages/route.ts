import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: channelId } = await params;

  const messages = await prisma.message.findMany({
    where: { channelId, deletedAt: null },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      attachments: true,
    },
    orderBy: { createdAt: "asc" },
    take: 150,
  });
  return NextResponse.json(messages);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role ?? "";
  const { id: channelId } = await params;
  const body = await req.json();
  const { content, attachmentUrl } = body;

  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  if (channel.type === "announcement" && !["Admin", "Manager"].includes(role))
    return NextResponse.json({ error: "Only Admin/Manager can post in announcement channels" }, { status: 403 });

  try {
    const message = await prisma.message.create({
      data: {
        channelId,
        senderId: userId!,
        content: content.trim(),
        attachmentUrl: attachmentUrl ?? null,
        updatedAt: new Date(),
      },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(message);
  } catch (e) {
    console.error("Message create error:", e);
    const msg = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
