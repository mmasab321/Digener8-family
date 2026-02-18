import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { BuildsView } from "./BuildsView";

export default async function BuildsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role ?? "";
  const canEdit = role === "Admin" || role === "Manager";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Builds</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Internal projects: YouTube and SaaS builds.
        </p>
      </div>
      <BuildsView canEdit={canEdit} />
    </div>
  );
}
