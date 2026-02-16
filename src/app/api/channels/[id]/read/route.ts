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

  await prisma.channelMember.upsert({
    where: { channelId_userId: { channelId, userId: userId! } },
    create: { channelId, userId: userId!, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
