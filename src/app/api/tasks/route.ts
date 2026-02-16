import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      category: true,
    },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, status, priority, assignedToId, categoryId, metricId, deadline } =
    body;

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const maxOrder = await prisma.task.aggregate({
    _max: { order: true },
    where: { status: status || "Backlog" },
  });

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      status: status || "Backlog",
      priority: priority || "Medium",
      assignedToId: assignedToId || null,
      categoryId: categoryId || null,
      metricId: metricId || null,
      deadline: deadline ? new Date(deadline) : null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      category: true,
    },
  });
  const uid = (session.user as { id?: string }).id;
  await logActivity(uid ?? null, "created", "Task", task.id, task.categoryId);
  return NextResponse.json(task);
}
