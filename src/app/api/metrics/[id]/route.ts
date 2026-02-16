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

  const metric = await prisma.metric.findUnique({
    where: { id },
    include: { category: true, entries: { orderBy: { periodStart: "desc" }, take: 50 } },
  });
  if (!metric) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(metric);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:metrics"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const metric = await prisma.metric.update({
    where: { id },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.categoryId != null && { categoryId: body.categoryId || null }),
      ...(body.valueType != null && { valueType: body.valueType }),
      ...(body.frequency != null && { frequency: body.frequency }),
      ...(body.targetValue != null && { targetValue: body.targetValue === "" ? null : Number(body.targetValue) }),
      ...(body.apiReady != null && { apiReady: body.apiReady }),
      ...(body.archived != null && { archived: body.archived }),
    },
    include: { category: true },
  });
  return NextResponse.json(metric);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:metrics"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.metric.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
