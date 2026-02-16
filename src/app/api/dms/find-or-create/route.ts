import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  const body = await req.json();
  const { otherUserId } = body;

  if (!otherUserId || otherUserId === userId)
    return NextResponse.json({ error: "otherUserId required and must differ from self" }, { status: 400 });

  const allDmsWithBoth = await prisma.directMessage.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    include: {
      participants: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  const dm = allDmsWithBoth.find(
    (d) =>
      d.participants.length === 2 &&
      d.participants.some((p) => p.userId === userId) &&
      d.participants.some((p) => p.userId === otherUserId)
  );

  if (!dm) {
    const created = await prisma.directMessage.create({
      data: {
        participants: {
          create: [
            { userId: userId! },
            { userId: otherUserId },
          ],
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    const other = created.participants.find((p) => p.userId !== userId)?.user;
    return NextResponse.json({ id: created.id, otherUser: other });
  }

  const other = dm.participants.find((p) => p.userId !== userId)?.user;
  return NextResponse.json({ id: dm.id, otherUser: other });
}
