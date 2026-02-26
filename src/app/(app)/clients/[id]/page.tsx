import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientDetailView } from "../ClientDetailView";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      services: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              serviceCategory: { select: { id: true, name: true, order: true } },
            },
          },
        },
      },
    },
  });

  if (!client) notFound();

  const role = (session.user as { role?: string }).role ?? "";
  const isAdmin = role === "Admin";
  const canEditBrief = role === "Admin" || role === "Manager";

  const clientJson = JSON.parse(JSON.stringify(client));

  return (
    <div className="space-y-4">
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Clients
      </Link>
      <ClientDetailView client={clientJson} isAdmin={isAdmin} canEditBrief={canEditBrief} />
    </div>
  );
}
