import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;

  const channels = await prisma.channel.findMany({
    include: {
      channelCategory: true,
      members: { where: { userId } },
      _count: { select: { messages: true } },
    },
    orderBy: { name: "asc" },
  });

  const withUnread = await Promise.all(
    channels.map(async (ch) => {
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
  );
  return NextResponse.json(withUnread);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, channelCategoryId, description, visibility, type } = body;

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const baseSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || `channel-${Date.now()}`;
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    try {
      const channel = await prisma.channel.create({
        data: {
          name,
          slug,
          channelCategoryId: channelCategoryId || null,
          description: description || null,
          visibility: visibility || "public",
          type: type || "normal",
        },
        include: { channelCategory: true },
      });
      return NextResponse.json(channel);
    } catch (err: unknown) {
      const isUniqueViolation =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "P2002";
      if (isUniqueViolation && attempt === 0) {
        attempt++;
        slug = `${baseSlug}-${Date.now().toString(36)}`;
        continue;
      }
      if (isUniqueViolation)
        return NextResponse.json(
          { error: "A channel with this name already exists. Try a different name." },
          { status: 400 }
        );
      throw err;
    }
  }
}
