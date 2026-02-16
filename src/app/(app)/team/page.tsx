import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TeamManagement } from "./TeamManagement";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:users")) redirect("/dashboard");

  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Team Management</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Add and remove users, assign roles. Admin only.
        </p>
      </div>
      <TeamManagement users={users} roles={roles} />
    </div>
  );
}
