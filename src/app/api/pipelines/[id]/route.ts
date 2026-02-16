import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const pipeline = await prisma.pipeline.findUnique({
    where: { id },
    include: {
      category: true,
      stages: {
        orderBy: { order: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      },
      items: { include: { assignedTo: true, category: true } },
    },
  });
  if (!pipeline) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(pipeline);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:pipelines"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const pipeline = await prisma.pipeline.update({
    where: { id },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.categoryId != null && { categoryId: body.categoryId || null }),
      ...(body.description != null && { description: body.description }),
    },
    include: { stages: true, category: true },
  });
  return NextResponse.json(pipeline);
}
