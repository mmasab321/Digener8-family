import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsView } from "./SettingsView";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:categories")) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-[var(--text-muted)]">You don’t have access to admin settings.</p>
      </div>
    );
  }

  const [users, roles, categories] = await Promise.all([
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
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Manage users, roles, and categories.
        </p>
      </div>
      <SettingsView users={users} roles={roles} categories={categories} />
    </div>
  );
}
