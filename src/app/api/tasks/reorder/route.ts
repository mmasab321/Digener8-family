import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { taskId, status, index } = body as { taskId?: string; status?: string; index?: number };
  if (!taskId || status == null || typeof index !== "number" || index < 0)
    return NextResponse.json({ error: "taskId, status, and index required" }, { status: 400 });

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  const sameStatus = await prisma.task.findMany({
    where: { status },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    select: { id: true },
  });

  const ids = sameStatus.map((t) => t.id);
  const fromIdx = ids.indexOf(taskId);
  if (fromIdx === -1) return NextResponse.json({ ok: true });

  ids.splice(fromIdx, 1);
  ids.splice(Math.min(index, ids.length), 0, taskId);

  await Promise.all(
    ids.map((id, i) => prisma.task.update({ where: { id }, data: { order: i } }))
  );

  return NextResponse.json({ ok: true });
}
