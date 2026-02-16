import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommunicationHub } from "./CommunicationHub";

export default async function CommunicationPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role ?? "";
  const isAdmin = userRole === "Admin";
  const canCreateChannel = true;

  const [channelCategoriesRaw, uncategorizedChannels, users] = await Promise.all([
    prisma.channelCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        channels: {
          orderBy: { name: "asc" },
          include: {
            members: { where: { userId: userId ?? "" } },
            _count: { select: { messages: true, members: true } },
          },
        },
      },
    }),
    prisma.channel.findMany({
      where: { channelCategoryId: null },
      orderBy: { name: "asc" },
      include: {
        members: { where: { userId: userId ?? "" } },
        _count: { select: { messages: true, members: true } },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      where: { id: { not: userId ?? "" } },
    }),
  ]);

  const channelCategories = uncategorizedChannels.length
    ? [
        {
          id: "__uncategorized__",
          name: "Other",
          slug: "other",
          order: -1,
          channels: uncategorizedChannels,
        },
        ...channelCategoriesRaw,
      ]
    : channelCategoriesRaw;

  const categoriesWithUnread = await Promise.all(
    channelCategories.map(async (cat) => ({
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

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col min-h-0">
      <CommunicationHub
        channelCategories={categoriesWithUnread}
        users={users}
        currentUser={{
          id: userId ?? "",
          name: (session?.user?.name as string) ?? "",
          email: (session?.user?.email as string) ?? "",
          role: userRole,
        }}
        canCreateChannel={canCreateChannel}
        isAdmin={isAdmin}
      />
    </div>
  );
}
