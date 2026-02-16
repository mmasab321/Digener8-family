import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  const { id } = await params;
  const body = await req.json();
  const { content } = body;

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (message.senderId !== userId)
    return NextResponse.json({ error: "Can only edit your own message" }, { status: 403 });
  if (message.deletedAt) return NextResponse.json({ error: "Message deleted" }, { status: 400 });

  const updated = await prisma.message.update({
    where: { id },
    data: { content: content?.trim() ?? message.content, updatedAt: new Date() },
    include: { sender: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  const { id } = await params;

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (message.senderId !== userId)
    return NextResponse.json({ error: "Can only delete your own message" }, { status: 403 });

  await prisma.message.update({
    where: { id },
    data: { deletedAt: new Date(), content: "" },
  });
  await prisma.pinnedMessage.deleteMany({ where: { messageId: id } });
  return NextResponse.json({ ok: true });
}
