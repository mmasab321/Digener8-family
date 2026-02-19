import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";

  const where: Prisma.ClientWhereInput = {};
  if (status && status !== "All") where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      services: {
        include: { service: { select: { id: true, name: true } } },
      },
    },
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    name,
    companyName,
    email,
    phone,
    website,
    country,
    status,
    managerId,
    notes,
    services: servicesPayload,
    briefText,
    links: linksPayload,
  } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const client = await prisma.client.create({
    data: {
      name: name.trim(),
      companyName: companyName?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      website: website?.trim() || null,
      country: country?.trim() || null,
      status: status || "Onboarding",
      managerId: managerId || null,
      notes: notes?.trim() || null,
    },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      services: {
        include: { service: { select: { id: true, name: true } } },
      },
    },
  });

  const services = Array.isArray(servicesPayload) ? servicesPayload : [];
  for (const s of services) {
    if (!s?.serviceId) continue;
    await prisma.clientService.create({
      data: {
        clientId: client.id,
        serviceId: s.serviceId,
        billingType: s.billingType || "Monthly",
        price: s.price != null ? Number(s.price) : null,
        startDate: s.startDate ? new Date(s.startDate) : null,
        notes: s.notes?.trim() || null,
        status: "Active",
      },
    });
  }

  const hasBrief = briefText != null || (Array.isArray(linksPayload) && linksPayload.length > 0);
  if (hasBrief) {
    const brief = await prisma.clientBrief.create({
      data: {
        clientId: client.id,
        briefText: typeof briefText === "string" ? briefText.trim() || null : null,
      },
    });
    const links = Array.isArray(linksPayload) ? linksPayload : [];
    for (const l of links) {
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
  }

  const withServices = await prisma.client.findUnique({
    where: { id: client.id },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      services: {
        include: { service: { select: { id: true, name: true } } },
      },
    },
  });
  return NextResponse.json(withServices ?? client);
}
