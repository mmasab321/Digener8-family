import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MyTasksView } from "./MyTasksView";

export default async function MyTasksPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) redirect("/login");

  const tasks = await prisma.task.findMany({
    where: { assignedToId: userId },
    orderBy: [{ status: "asc" }, { deadline: "asc" }, { updatedAt: "desc" }],
    include: { assignedTo: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">My Tasks</h1>
        <p className="text-sm text-[var(--text-muted)]">View-only list of tasks assigned to you.</p>
      </div>
      <MyTasksView tasks={tasks} />
    </div>
  );
}
