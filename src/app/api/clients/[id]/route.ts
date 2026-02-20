import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromWasabi } from "@/lib/storage/s3Client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      services: {
        include: {
          service: { select: { id: true, name: true, serviceCategory: { select: { id: true, name: true, order: true } } } },
        },
      },
    },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = String(body.name).trim();
  if (body.companyName != null) data.companyName = body.companyName ? String(body.companyName).trim() : null;
  if (body.email != null) data.email = body.email ? String(body.email).trim() : null;
  if (body.phone != null) data.phone = body.phone ? String(body.phone).trim() : null;
  if (body.website != null) data.website = body.website ? String(body.website).trim() : null;
  if (body.country != null) data.country = body.country ? String(body.country).trim() : null;
  if (body.status != null) data.status = body.status;
  if (body.managerId != null) data.managerId = body.managerId || null;
  if (body.notes != null) data.notes = body.notes ? String(body.notes).trim() : null;

  const client = await prisma.client.update({
    where: { id },
    data,
    include: {
      manager: { select: { id: true, name: true, email: true } },
      services: {
        include: { service: { select: { id: true, name: true } } },
      },
    },
  });
  return NextResponse.json(client);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: { brief: { include: { assets: { select: { storageKey: true } } } } },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  for (const asset of client.brief?.assets ?? []) {
    await deleteFromWasabi(asset.storageKey);
  }
  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
