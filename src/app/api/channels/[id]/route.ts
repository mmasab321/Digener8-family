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
  const userId = (session.user as { id?: string }).id;
  const { id } = await params;

  const channel = await prisma.channel.findUnique({
    where: { id },
    include: {
      channelCategory: true,
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { messages: true } },
    },
  });
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lastMessage = await prisma.message.findFirst({
    where: { channelId: id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { sender: { select: { name: true, email: true } } },
  });

  await prisma.channelMember.upsert({
    where: { channelId_userId: { channelId: id, userId: userId! } },
    create: { channelId: id, userId: userId!, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });

  return NextResponse.json({
    ...channel,
    lastActivityAt: lastMessage?.createdAt ?? channel.createdAt,
    lastMessage: lastMessage
      ? { content: lastMessage.content, sender: lastMessage.sender, createdAt: lastMessage.createdAt }
      : null,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const channel = await prisma.channel.findUnique({ where: { id } });
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const name = body.name as string | undefined;
  const description = body.description as string | undefined;
  const channelCategoryId = body.channelCategoryId as string | null | undefined;
  const visibility = body.visibility as string | undefined;
  const type = body.type as string | undefined;

  const data: { name?: string; slug?: string; description?: string | null; channelCategoryId?: string | null; visibility?: string; type?: string } = {};
  if (name != null) {
    data.name = name;
    const baseSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `channel-${Date.now()}`;
    const existing = await prisma.channel.findFirst({ where: { slug: baseSlug, id: { not: id } } });
    data.slug = existing ? `${baseSlug}-${id.slice(-6)}` : baseSlug;
  }
  if (description !== undefined) data.description = description || null;
  if (channelCategoryId !== undefined) data.channelCategoryId = channelCategoryId || null;
  if (visibility != null) data.visibility = visibility;
  if (type != null) data.type = type;

  const updated = await prisma.channel.update({
    where: { id },
    data,
    include: { channelCategory: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.channel.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
