import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
        });
        if (!user) return null;
        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role.name,
          roleId: user.roleId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.roleId = (user as { roleId?: string }).roleId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { roleId?: string }).roleId = token.roleId as string;
      }
      return session;
    },
  },
};

export const ROLES = ["Admin", "Manager", "Contributor", "Viewer"] as const;
export type RoleName = (typeof ROLES)[number];

export function hasPermission(role: string, permission: string): boolean {
  const hierarchy: Record<string, number> = { Admin: 4, Manager: 3, Contributor: 2, Viewer: 1 };
  const level = hierarchy[role] ?? 0;
  const required: Record<string, number> = {
    "admin:users": 4,
    "admin:roles": 4,
    "admin:categories": 4,
    "admin:metrics": 4,
    "admin:pipelines": 4,
    "admin:channels": 4,
    "admin:settings": 4,
    "manage:tasks": 3,
    "manage:pipeline": 3,
    "manage:metrics": 3,
    "create:sop": 2,
    "edit:sop": 2,
    "view:all": 1,
  };
  return level >= (required[permission] ?? 0);
}
