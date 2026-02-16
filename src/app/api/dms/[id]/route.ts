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
  const { id: dmId } = await params;

  const dm = await prisma.directMessage.findUnique({
    where: { id: dmId },
    include: {
      participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        include: { sender: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!dm) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isParticipant = dm.participants.some((p) => p.userId === userId);
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.directMessageParticipant.updateMany({
    where: { dmId, userId: userId! },
    data: { lastReadAt: new Date() },
  });

  const other = dm.participants.find((p) => p.userId !== userId)?.user;
  return NextResponse.json({ ...dm, otherUser: other });
}
