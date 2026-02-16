import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SOPForm } from "../SOPForm";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function SOPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sop, categories] = await Promise.all([
    prisma.sOP.findUnique({
      where: { id },
      include: { category: true, author: { select: { name: true, email: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!sop) notFound();

  return (
    <div className="max-w-4xl">
      <Link
        href="/sop"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to SOP Vault
      </Link>
      <h1 className="text-2xl font-semibold text-white mb-6">Edit document</h1>
      <SOPForm sop={sop} categories={categories} />
    </div>
  );
}
