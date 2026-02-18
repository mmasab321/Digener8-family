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
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: clientId } = await params;

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await req.json();
  const { serviceId, billingType, price, startDate, notes } = body;
  if (!serviceId) return NextResponse.json({ error: "serviceId required" }, { status: 400 });

  const existing = await prisma.clientService.findUnique({
    where: { clientId_serviceId: { clientId, serviceId } },
  });
  if (existing) return NextResponse.json({ error: "Service already added to client" }, { status: 400 });

  const clientService = await prisma.clientService.create({
    data: {
      clientId,
      serviceId,
      billingType: billingType || "Monthly",
      price: price != null ? Number(price) : null,
      startDate: startDate ? new Date(startDate) : null,
      notes: notes?.trim() || null,
      status: "Active",
    },
    include: {
      service: { select: { id: true, name: true, serviceCategory: { select: { id: true, name: true, order: true } } } },
    },
  });
  return NextResponse.json(clientService);
}
