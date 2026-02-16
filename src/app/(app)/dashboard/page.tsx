import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MinimalDashboard } from "./MinimalDashboard";

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const todayEnd = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const role = (session?.user as { role?: string })?.role ?? "";

  if (!["Admin", "Manager"].includes(role)) {
    if (role === "Contributor") redirect("/tasks");
    redirect("/my-tasks");
  }
  if (!userId) return null;

  const start = todayStart();
  const end = todayEnd();

  const [dueToday, overdue, recentlyUpdated, channelsWithMessages] = await Promise.all([
    prisma.task.findMany({
      where: {
        assignedToId: userId,
        deadline: { gte: start, lte: end },
        status: { not: "Done" },
      },
      include: { assignedTo: { select: { name: true, email: true } } },
      orderBy: { deadline: "asc" },
    }),
    prisma.task.findMany({
      where: {
        assignedToId: userId,
        deadline: { lt: start },
        status: { not: "Done" },
      },
      include: { assignedTo: { select: { name: true, email: true } } },
      orderBy: { deadline: "asc" },
      take: 20,
    }),
    prisma.task.findMany({
      where: { assignedToId: userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { assignedTo: { select: { name: true, email: true } } },
    }),
    prisma.channel.findMany({
      where: { messages: { some: {} } },
      include: { channelCategory: true },
      take: 20,
    }),
  ]);

  const channelsWithLastActivity = await Promise.all(
    channelsWithMessages.map(async (ch) => {
      const last = await prisma.message.findFirst({
        where: { channelId: ch.id },
        orderBy: { createdAt: "desc" },
      });
      return { ...ch, lastActivityAt: last?.createdAt ?? ch.createdAt };
    })
  );
  channelsWithLastActivity.sort(
    (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
  );
  const activeChannels = channelsWithLastActivity.slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Tasks and channels that need your attention.
        </p>
      </div>
      <MinimalDashboard
        dueToday={dueToday}
        overdue={overdue}
        recentlyUpdated={recentlyUpdated}
        activeChannels={channelsWithLastActivity}
        userId={userId}
      />
    </div>
  );
}
