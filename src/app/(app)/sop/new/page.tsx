import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SOPForm } from "../SOPForm";

export default async function NewSOPPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-white mb-6">New document</h1>
      <SOPForm categories={categories} />
    </div>
  );
}
