import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }
    const contributor = await prisma.role.findUnique({ where: { name: "Contributor" } });
    if (!contributor) {
      return NextResponse.json({ error: "Roles not seeded" }, { status: 500 });
    }
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash: await hash(password, 10),
        roleId: contributor.id,
      },
      select: { id: true, email: true, name: true },
    });
    return NextResponse.json(user);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
