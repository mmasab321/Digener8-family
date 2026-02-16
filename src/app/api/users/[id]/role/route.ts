import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:users"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const { roleId } = body;

  if (!roleId) return NextResponse.json({ error: "roleId required" }, { status: 400 });

  const user = await prisma.user.update({
    where: { id },
    data: { roleId },
    select: { id: true, email: true, name: true, role: { select: { name: true } } },
  });
  return NextResponse.json(user);
}
