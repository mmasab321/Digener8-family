import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const archived = searchParams.get("archived");

  const metrics = await prisma.metric.findMany({
    where: {
      ...(categoryId && { categoryId }),
      ...(archived !== "true" && { archived: false }),
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(metrics);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:metrics"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, categoryId, valueType, frequency, targetValue, apiReady } = body;

  if (!name || !valueType || !frequency)
    return NextResponse.json(
      { error: "name, valueType, frequency required" },
      { status: 400 }
    );

  const metric = await prisma.metric.create({
    data: {
      name,
      categoryId: categoryId || null,
      valueType,
      frequency,
      targetValue: targetValue != null ? Number(targetValue) : null,
      apiReady: !!apiReady,
    },
    include: { category: true },
  });
  return NextResponse.json(metric);
}
