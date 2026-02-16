import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pipelines = await prisma.pipeline.findMany({
    include: {
      category: true,
      stages: { orderBy: { order: "asc" } },
      items: true,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(pipelines);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:pipelines"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, categoryId, description, stages } = body;

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const pipeline = await prisma.pipeline.create({
    data: {
      name,
      categoryId: categoryId || null,
      description: description || null,
      stages: {
        create: (stages || ["New", "In Progress", "Done"]).map(
          (s: string | { name: string }, i: number) => ({
            name: typeof s === "string" ? s : s.name,
            order: i,
          })
        ),
      },
    },
    include: { stages: true, category: true },
  });
  return NextResponse.json(pipeline);
}
