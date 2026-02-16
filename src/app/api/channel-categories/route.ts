import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;

  const categories = await prisma.channelCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      channels: {
        orderBy: { name: "asc" },
        include: {
          members: { where: { userId } },
          _count: { select: { messages: true, members: true } },
        },
      },
    },
  });

  const withUnread = await Promise.all(
    categories.map(async (cat) => ({
      ...cat,
      channels: await Promise.all(
        cat.channels.map(async (ch) => {
          const membership = ch.members[0];
          const lastRead = membership?.lastReadAt ?? null;
          const unreadCount = lastRead
            ? await prisma.message.count({
                where: {
                  channelId: ch.id,
                  createdAt: { gt: lastRead },
                  deletedAt: null,
                },
              })
            : ch._count.messages;
          const lastMessage = await prisma.message.findFirst({
            where: { channelId: ch.id, deletedAt: null },
            orderBy: { createdAt: "desc" },
          });
          return {
            ...ch,
            unreadCount,
            lastActivityAt: lastMessage?.createdAt ?? ch.createdAt,
          };
        })
      ),
    }))
  );
  return NextResponse.json(withUnread);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:channels"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, slug } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const slugVal = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const maxOrder = await prisma.channelCategory.aggregate({ _max: { order: true } });
  const category = await prisma.channelCategory.create({
    data: { name, slug: slugVal, order: (maxOrder._max.order ?? -1) + 1 },
  });
  return NextResponse.json(category);
}
