import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  const { id: dmId } = await params;
  const body = await req.json();
  const { content } = body;

  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  const dm = await prisma.directMessage.findUnique({
    where: { id: dmId },
    include: { participants: true },
  });
  if (!dm) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isParticipant = dm.participants.some((p) => p.userId === userId);
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const message = await prisma.directMessageContent.create({
    data: { dmId, senderId: userId!, content: content.trim() },
    include: { sender: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(message);
}
