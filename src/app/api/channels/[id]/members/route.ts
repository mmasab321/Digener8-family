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
  const { id: channelId } = await params;
  const body = await req.json().catch(() => ({}));
  const userId = body.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const currentUserId = (session.user as { id?: string }).id;
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { members: { where: { userId: currentUserId } } },
  });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  if (channel.members.length === 0)
    return NextResponse.json({ error: "You must be a member of this channel to add members" }, { status: 403 });

  await prisma.channelMember.upsert({
    where: { channelId_userId: { channelId, userId } },
    create: { channelId, userId },
    update: {},
  });
  return NextResponse.json({ ok: true });
}
