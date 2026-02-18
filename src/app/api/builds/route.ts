import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BuildType, BuildStatus } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type")?.trim() as BuildType | null;
  const status = searchParams.get("status")?.trim() as BuildStatus | null;
  const search = searchParams.get("search")?.trim() || "";

  const where: { type?: BuildType; status?: BuildStatus; OR?: { name: { contains: string; mode: "insensitive" }; description: { contains: string; mode: "insensitive" } }[] } = {};
  if (type && (type === "YOUTUBE" || type === "SAAS")) where.type = type;
  if (status && ["PLANNING", "ACTIVE", "PAUSED", "COMPLETED"].includes(status)) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const builds = await prisma.build.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
    },
  });
  return NextResponse.json(builds);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin" && role !== "Manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    name,
    description,
    type,
    status,
    priority,
    ownerId,
    progress,
    startDate,
    targetDate,
    youtubeUploadTarget,
    youtubeVideosThisMonth,
    saasStage,
  } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (type !== "YOUTUBE" && type !== "SAAS") return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  const progressNum = progress != null ? Math.min(100, Math.max(0, Number(progress))) : 0;

  const build = await prisma.build.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      type,
      status: status || "PLANNING",
      priority: priority || "MEDIUM",
      ownerId: ownerId || null,
      progress: progressNum,
      startDate: startDate ? new Date(startDate) : null,
      targetDate: targetDate ? new Date(targetDate) : null,
      youtubeUploadTarget: type === "YOUTUBE" ? (youtubeUploadTarget?.trim() || null) : null,
      youtubeVideosThisMonth: type === "YOUTUBE" ? (youtubeVideosThisMonth != null ? Number(youtubeVideosThisMonth) : 0) : null,
      saasStage: type === "SAAS" ? saasStage || null : null,
    },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
    },
  });
  return NextResponse.json(build);
}
