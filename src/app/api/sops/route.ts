import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const categoryId = searchParams.get("categoryId");
  const tag = searchParams.get("tag");

  const sops = await prisma.sOP.findMany({
    where: {
      ...(categoryId && { categoryId }),
      ...(tag && { tags: { contains: tag } }),
      ...(q && {
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { tags: { contains: q } },
        ],
      }),
    },
    include: { category: true, author: { select: { id: true, name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(sops);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;

  const body = await req.json();
  const { title, content, categoryId, tags } = body;

  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const sop = await prisma.sOP.create({
    data: {
      title,
      content: content || "",
      categoryId: categoryId || null,
      authorId: userId!,
      tags: tags ? (Array.isArray(tags) ? tags.join(",") : String(tags)) : null,
    },
    include: { category: true, author: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(sop);
}
