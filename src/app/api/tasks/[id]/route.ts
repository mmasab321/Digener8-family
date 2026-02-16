import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      category: true,
      metric: true,
    },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(body.title != null && { title: body.title }),
      ...(body.description != null && { description: body.description }),
      ...(body.status != null && { status: body.status }),
      ...(body.priority != null && { priority: body.priority }),
      ...(body.assignedToId != null && { assignedToId: body.assignedToId || null }),
      ...(body.categoryId != null && { categoryId: body.categoryId || null }),
      ...(body.deadline != null && { deadline: body.deadline ? new Date(body.deadline) : null }),
    },
  });
  return NextResponse.json(task);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
