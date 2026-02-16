import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskForm } from "../TaskForm";

export default async function NewTaskPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "";
  if (role === "Viewer") redirect("/my-tasks");

  const [users, categories] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-white mb-6">New task</h1>
      <TaskForm users={users} categories={categories} />
    </div>
  );
}
