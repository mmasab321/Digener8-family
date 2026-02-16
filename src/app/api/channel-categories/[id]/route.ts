import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:channels"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const category = await prisma.channelCategory.findUnique({ where: { id } });
  if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const name = body.name as string | undefined;
  const slug = body.slug as string | undefined;
  const order = body.order as number | undefined;

  const data: { name?: string; slug?: string; order?: number } = {};
  if (name != null) data.name = name;
  if (slug != null) data.slug = slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || category.slug;
  if (order !== undefined) data.order = order;

  const updated = await prisma.channelCategory.update({
    where: { id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:channels"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.channelCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
