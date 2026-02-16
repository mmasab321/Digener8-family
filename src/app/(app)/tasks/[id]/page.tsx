import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TaskForm } from "../TaskForm";
import { TaskReadOnly } from "../TaskReadOnly";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const [task, users, categories] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        category: true,
        attachments: true,
      },
    }),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!task) notFound();

  const role = (session?.user as { role?: string })?.role ?? "";
  const isViewer = role === "Viewer";

  return (
    <div className="max-w-2xl">
      <Link
        href={isViewer ? "/my-tasks" : "/tasks"}
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {isViewer ? "my tasks" : "tasks"}
      </Link>
      {isViewer ? (
        <TaskReadOnly task={task} />
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-white mb-6">Edit task</h1>
          <TaskForm task={task} users={users} categories={categories} />
        </>
      )}
    </div>
  );
}
