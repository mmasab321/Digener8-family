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
  const { id: metricId } = await params;
  const userId = (session.user as { id?: string }).id;
  const body = await req.json();
  const { value, periodStart } = body;

  if (value == null) return NextResponse.json({ error: "value required" }, { status: 400 });

  const metric = await prisma.metric.findUnique({ where: { id: metricId } });
  if (!metric) return NextResponse.json({ error: "Metric not found" }, { status: 404 });

  const start = periodStart ? new Date(periodStart) : new Date();
  // Normalize to period start (day/week/month) based on frequency
  const d = new Date(start);
  if (metric.frequency === "Daily") {
    d.setHours(0, 0, 0, 0);
  } else if (metric.frequency === "Weekly") {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }

  const entry = await prisma.metricEntry.create({
    data: {
      metricId,
      value: Number(value),
      periodStart: d,
      enteredById: userId || null,
    },
    include: { metric: true },
  });
  return NextResponse.json(entry);
}
