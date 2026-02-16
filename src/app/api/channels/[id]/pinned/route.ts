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

  const pinned = await prisma.pinnedMessage.findMany({
    where: { channelId },
    include: {
      message: {
        include: { sender: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { pinnedAt: "desc" },
  });
  return NextResponse.json(pinned.map((p) => ({ ...p.message, pinnedAt: p.pinnedAt })));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  const { id: channelId } = await params;
  const body = await req.json();
  const { messageId } = body;

  if (!messageId) return NextResponse.json({ error: "messageId required" }, { status: 400 });

  const existing = await prisma.pinnedMessage.findUnique({ where: { messageId } });
  if (existing) return NextResponse.json({ error: "Already pinned" }, { status: 400 });

  await prisma.pinnedMessage.create({
    data: { channelId, messageId, pinnedById: userId! },
  });
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { sender: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(message);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: channelId } = await params;
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("messageId");
  if (!messageId) return NextResponse.json({ error: "messageId required" }, { status: 400 });

  await prisma.pinnedMessage.deleteMany({
    where: { channelId, messageId },
  });
  return NextResponse.json({ ok: true });
}
