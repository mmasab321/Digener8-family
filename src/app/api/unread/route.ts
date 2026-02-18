import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Returns total unread count: channels (messages since lastReadAt) + DMs (messages from others since lastReadAt).
 * Used for favicon badge.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ total: 0 });
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ total: 0 });

  const [channelUnread, dmUnread] = await Promise.all([
    prisma.channelMember.findMany({
      where: { userId },
      select: {
        lastReadAt: true,
        channelId: true,
      },
    }).then(async (members) => {
      let total = 0;
      for (const m of members) {
        const count = m.lastReadAt
          ? await prisma.message.count({
              where: {
                channelId: m.channelId,
                createdAt: { gt: m.lastReadAt },
                deletedAt: null,
              },
            })
          : await prisma.message.count({
              where: { channelId: m.channelId, deletedAt: null },
            });
        total += count;
      }
      return total;
    }),
    prisma.directMessageParticipant.findMany({
      where: { userId },
      select: { lastReadAt: true, dmId: true },
    }).then(async (participants) => {
      let total = 0;
      for (const p of participants) {
        const count = p.lastReadAt
          ? await prisma.directMessageContent.count({
              where: {
                dmId: p.dmId,
                senderId: { not: userId },
                createdAt: { gt: p.lastReadAt },
              },
            })
          : await prisma.directMessageContent.count({
              where: { dmId: p.dmId, senderId: { not: userId } },
            });
        total += count;
      }
      return total;
    }),
  ]);

  const total = channelUnread + dmUnread;
  return NextResponse.json({ total });
}
