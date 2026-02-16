import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TasksKanban } from "./TasksKanban";

const COLUMNS = ["Backlog", "To Do", "In Progress", "Review", "Done"];

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [tasks, users, categories] = await Promise.all([
    prisma.task.findMany({
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        category: true,
      },
    }),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const tasksByStatus = COLUMNS.map((col) => ({
    id: col,
    title: col,
    tasks: tasks.filter((t) => t.status === col),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Tasks</h1>
        <p className="text-sm text-[var(--text-muted)]">Kanban board. Drag to update status.</p>
      </div>
      <TasksKanban
        columns={tasksByStatus}
        users={users}
        categories={categories}
        currentUserId={(session?.user as { id?: string })?.id}
      />
    </div>
  );
}
