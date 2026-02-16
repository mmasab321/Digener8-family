import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;

  const dms = await prisma.directMessage.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: { include: { user: { select: { id: true, name: true, email: true } } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { name: true, email: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const withUnread = await Promise.all(
    dms.map(async (dm) => {
      const me = dm.participants.find((p) => p.userId === userId);
      const lastRead = me?.lastReadAt ?? null;
      const unreadCount = lastRead
        ? await prisma.directMessageContent.count({
            where: {
              dmId: dm.id,
              senderId: { not: userId },
              createdAt: { gt: lastRead },
            },
          })
        : await prisma.directMessageContent.count({
            where: { dmId: dm.id, senderId: { not: userId } },
          });
      const other = dm.participants.find((p) => p.userId !== userId)?.user;
      const lastMsg = dm.messages[0];
      return {
        id: dm.id,
        otherUser: other,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              createdAt: lastMsg.createdAt,
              senderName: lastMsg.sender?.name || lastMsg.sender?.email,
            }
          : null,
        unreadCount,
      };
    })
  );
  return NextResponse.json(withUnread);
}
