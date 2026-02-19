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

  const { id: clientId } = await params;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const brief = await prisma.clientBrief.findUnique({
    where: { clientId },
    include: {
      links: true,
      assets: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!brief) return NextResponse.json({ briefText: null, links: [], assets: [] });
  return NextResponse.json(brief);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin" && role !== "Manager") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const briefText = typeof body.briefText === "string" ? body.briefText.trim() || null : null;
  const linksPayload = Array.isArray(body.links) ? body.links : [];

  const brief = await prisma.clientBrief.upsert({
    where: { clientId },
    create: {
      clientId,
      briefText,
    },
    update: { briefText },
  });

  await prisma.clientLink.deleteMany({ where: { briefId: brief.id } });
  for (const l of linksPayload) {
    const url = typeof l?.url === "string" ? l.url.trim() : "";
    if (!url) continue;
    await prisma.clientLink.create({
      data: {
        briefId: brief.id,
        label: typeof l.label === "string" ? l.label.trim() || null : null,
        url,
      },
    });
  }

  const updated = await prisma.clientBrief.findUnique({
    where: { id: brief.id },
    include: { links: true, assets: true },
  });
  return NextResponse.json(updated);
}
