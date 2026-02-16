import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:pipelines"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: pipelineId } = await params;
  const body = await req.json();
  const { name } = body;

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const maxOrder = await prisma.pipelineStage.aggregate({
    _max: { order: true },
    where: { pipelineId },
  });

  const stage = await prisma.pipelineStage.create({
    data: { pipelineId, name, order: (maxOrder._max.order ?? -1) + 1 },
  });
  return NextResponse.json(stage);
}
