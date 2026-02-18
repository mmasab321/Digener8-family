import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ClientsView } from "./ClientsView";

export default async function ClientsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role ?? "";
  const isAdmin = role === "Admin";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Clients</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Manage clients and their services.
        </p>
      </div>
      <ClientsView isAdmin={isAdmin} />
    </div>
  );
}
