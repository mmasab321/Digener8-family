import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id;
  const { id: channelId } = await params;

  const existing = await prisma.channelMember.findFirst({
    where: { channelId, userId: userId! },
  });
  if (existing) return NextResponse.json({ ok: true });

  await prisma.channelMember.create({
    data: { channelId, userId: userId! },
  });
  return NextResponse.json({ ok: true });
}
