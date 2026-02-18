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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin" && role !== "Manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: buildId } = await params;
  const build = await prisma.build.findUnique({ where: { id: buildId } });
  if (!build) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const maxOrder = await prisma.buildChecklistItem
    .aggregate({ where: { buildId }, _max: { order: true } })
    .then((r) => r._max.order ?? -1);

  const item = await prisma.buildChecklistItem.create({
    data: {
      buildId,
      title,
      order: maxOrder + 1,
    },
  });
  await updateBuildProgress(buildId);
  return NextResponse.json(item);
}
