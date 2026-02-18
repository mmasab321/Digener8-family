import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Returns channel messages that should trigger a sound for the current user when they're NOT in that channel:
 * - @mentions (content contains @name or @email)
 * - Thread replies where user started the parent or already replied in the thread
 * Only messages from the last 5 minutes (or since= query) in channels the user is a member of.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ items: [] });
  const userId = (session.user as { id?: string }).id;
  const name = (session.user as { name?: string | null }).name ?? "";
  const email = (session.user as { email?: string | null }).email ?? "";
  if (!userId) return NextResponse.json({ items: [] });

  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 5 * 60 * 1000);

  const memberships = await prisma.channelMember.findMany({
    where: { userId },
    select: { channelId: true },
  });
  const channelIds = memberships.map((m) => m.channelId);
  if (channelIds.length === 0) return NextResponse.json({ items: [] });

  const messages = await prisma.message.findMany({
    where: {
      channelId: { in: channelIds },
      deletedAt: null,
      createdAt: { gt: since },
    },
    select: {
      id: true,
      channelId: true,
      parentId: true,
      senderId: true,
      content: true,
      parent: { select: { senderId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const nameLower = name.trim().toLowerCase();
  const emailLower = email.trim().toLowerCase();
  const mentionPattern = (n: string) => n && n.length > 0;
  const items: { id: string; channelId: string; type: "mention" | "thread_reply" }[] = [];
  const seenIds = new Set<string>();

  for (const msg of messages) {
    if (msg.senderId === userId) continue;
    if (seenIds.has(msg.id)) continue;

    const contentLower = (msg.content ?? "").toLowerCase();
    const isMention =
      (mentionPattern(nameLower) && contentLower.includes("@" + nameLower)) ||
      (mentionPattern(emailLower) && contentLower.includes("@" + emailLower));

    if (isMention) {
      items.push({ id: msg.id, channelId: msg.channelId!, type: "mention" });
      seenIds.add(msg.id);
      continue;
    }

    if (msg.parentId && msg.parent) {
      const isParentAuthor = msg.parent.senderId === userId;
      const iRepliedInThread = messages.some(
        (m) => m.parentId === msg.parentId && m.senderId === userId && m.id !== msg.id
      );
      if (isParentAuthor || iRepliedInThread) {
        items.push({ id: msg.id, channelId: msg.channelId!, type: "thread_reply" });
        seenIds.add(msg.id);
      }
    }
  }

  return NextResponse.json({ items });
}
