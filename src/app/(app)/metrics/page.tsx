import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MetricsView } from "./MetricsView";

export default async function MetricsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "";
  const [metrics, categories] = await Promise.all([
    prisma.metric.findMany({
      where: { archived: false },
      include: { category: true, entries: { orderBy: { periodStart: "desc" }, take: 20 } },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Metrics</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Track KPIs by category. Add entries and compare to targets.
        </p>
      </div>
      <MetricsView
        metrics={metrics}
        categories={categories}
        isAdmin={role === "Admin" || role === "Manager"}
      />
    </div>
  );
}
