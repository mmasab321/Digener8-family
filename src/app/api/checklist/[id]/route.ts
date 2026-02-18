import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function updateBuildProgress(buildId: string) {
  const items = await prisma.buildChecklistItem.findMany({
    where: { buildId },
    select: { isDone: true },
  });
  const total = items.length;
  const done = items.filter((i) => i.isDone).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  await prisma.build.update({
    where: { id: buildId },
    data: { progress },
  });
  return progress;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin" && role !== "Manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const item = await prisma.buildChecklistItem.findUnique({
    where: { id },
    select: { buildId: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: { isDone?: boolean; title?: string } = {};
  if (typeof body.isDone === "boolean") data.isDone = body.isDone;
  if (typeof body.title === "string") data.title = body.title.trim();

  const updated = await prisma.buildChecklistItem.update({
    where: { id },
    data,
  });
  await updateBuildProgress(item.buildId);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin" && role !== "Manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const item = await prisma.buildChecklistItem.findUnique({
    where: { id },
    select: { buildId: true },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.buildChecklistItem.delete({ where: { id } });
  await updateBuildProgress(item.buildId);
  return NextResponse.json({ ok: true });
}
