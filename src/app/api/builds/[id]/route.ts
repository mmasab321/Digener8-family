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

  const build = await prisma.build.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      checklistItems: { orderBy: { order: "asc" } },
    },
  });
  if (!build) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(build);
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
  const body = await req.json();

  const existing = await prisma.build.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = String(body.name).trim();
  if (body.description != null) data.description = body.description ? String(body.description).trim() : null;
  if (body.type != null && (body.type === "YOUTUBE" || body.type === "SAAS")) data.type = body.type;
  if (body.status != null && ["PLANNING", "ACTIVE", "PAUSED", "COMPLETED"].includes(body.status)) data.status = body.status;
  if (body.priority != null && ["LOW", "MEDIUM", "HIGH"].includes(body.priority)) data.priority = body.priority;
  if (body.ownerId != null) data.ownerId = body.ownerId || null;
  if (body.progress != null) data.progress = Math.min(100, Math.max(0, Number(body.progress)));
  if (body.startDate != null) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.targetDate != null) data.targetDate = body.targetDate ? new Date(body.targetDate) : null;
  if (existing.type === "YOUTUBE") {
    if (body.youtubeUploadTarget != null) data.youtubeUploadTarget = body.youtubeUploadTarget ? String(body.youtubeUploadTarget).trim() : null;
    if (body.youtubeVideosThisMonth != null) data.youtubeVideosThisMonth = Number(body.youtubeVideosThisMonth);
  }
  if (existing.type === "SAAS" && body.saasStage != null && ["IDEA", "BUILDING", "BETA", "LIVE"].includes(body.saasStage)) {
    data.saasStage = body.saasStage;
  }

  const build = await prisma.build.update({
    where: { id },
    data,
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
    },
  });
  return NextResponse.json(build);
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

  await prisma.build.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
