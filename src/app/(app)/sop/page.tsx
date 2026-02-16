import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { BookOpen, Plus, Search } from "lucide-react";
import { SOPList } from "./SOPList";

export default async function SOPPage() {
  const session = await getServerSession(authOptions);
  const [sops, categories] = await Promise.all([
    prisma.sOP.findMany({
      include: { category: true, author: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">SOP Vault</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Documents, procedures, and knowledge base.
          </p>
        </div>
        <Link
          href="/sop/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          <Plus className="h-4 w-4" /> New document
        </Link>
      </div>
      <SOPList initialSops={sops} categories={categories} />
    </div>
  );
}
