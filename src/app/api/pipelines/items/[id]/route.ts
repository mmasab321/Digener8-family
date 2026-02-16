import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const item = await prisma.pipelineItem.update({
    where: { id },
    data: {
      ...(body.stageId != null && { stageId: body.stageId }),
      ...(body.title != null && { title: body.title }),
      ...(body.assignedToId != null && { assignedToId: body.assignedToId || null }),
      ...(body.categoryId != null && { categoryId: body.categoryId || null }),
      ...(body.value != null && { value: body.value === "" ? null : Number(body.value) }),
      ...(body.notes != null && { notes: body.notes }),
      ...(body.customFields != null && {
        customFields: body.customFields ? JSON.stringify(body.customFields) : null,
      }),
    },
    include: { assignedTo: true, category: true, stage: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.pipelineItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
