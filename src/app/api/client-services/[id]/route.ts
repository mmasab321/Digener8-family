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
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.billingType != null) data.billingType = body.billingType;
  if (body.price != null) data.price = body.price === "" ? null : Number(body.price);
  if (body.startDate != null) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.notes != null) data.notes = body.notes ? String(body.notes).trim() : null;
  if (body.status != null) data.status = body.status;

  const clientService = await prisma.clientService.update({
    where: { id },
    data,
    include: {
      service: { select: { id: true, name: true, serviceCategory: { select: { id: true, name: true, order: true } } } },
    },
  });
  return NextResponse.json(clientService);
}
