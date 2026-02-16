import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: pipelineId } = await params;
  const body = await req.json();
  const { stageId, title, assignedToId, categoryId, value, notes, customFields } = body;

  if (!title || !stageId)
    return NextResponse.json({ error: "title and stageId required" }, { status: 400 });

  const maxOrder = await prisma.pipelineItem.aggregate({
    _max: { order: true },
    where: { stageId },
  });

  const item = await prisma.pipelineItem.create({
    data: {
      pipelineId,
      stageId,
      title,
      assignedToId: assignedToId || null,
      categoryId: categoryId || null,
      value: value != null ? Number(value) : null,
      notes: notes || null,
      customFields: customFields ? JSON.stringify(customFields) : null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    include: { assignedTo: true, category: true, stage: true },
  });
  return NextResponse.json(item);
}
