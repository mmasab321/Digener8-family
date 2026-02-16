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

  const sop = await prisma.sOP.findUnique({
    where: { id },
    include: { category: true, author: { select: { id: true, name: true, email: true } } },
  });
  if (!sop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sop);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const sop = await prisma.sOP.update({
    where: { id },
    data: {
      ...(body.title != null && { title: body.title }),
      ...(body.content != null && { content: body.content }),
      ...(body.categoryId != null && { categoryId: body.categoryId || null }),
      ...(body.tags != null && {
        tags: body.tags ? (Array.isArray(body.tags) ? body.tags.join(",") : String(body.tags)) : null,
      }),
    },
    include: { category: true, author: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(sop);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.sOP.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
