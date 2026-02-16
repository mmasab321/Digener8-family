import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PipelineView } from "./PipelineView";

export default async function PipelinePage() {
  const session = await getServerSession(authOptions);
  const [pipelines, users, categories] = await Promise.all([
    prisma.pipeline.findMany({
      include: {
        category: true,
        stages: {
          orderBy: { order: "asc" },
          include: {
            items: {
              orderBy: { order: "asc" },
              include: { assignedTo: true, category: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const isAdmin = (session?.user as { role?: string })?.role === "Admin" || (session?.user as { role?: string })?.role === "Manager";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Pipeline</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Track leads, projects, or any workflow with customizable stages.
        </p>
      </div>
      <PipelineView
        pipelines={pipelines}
        users={users}
        categories={categories}
        isAdmin={isAdmin}
      />
    </div>
  );
}
