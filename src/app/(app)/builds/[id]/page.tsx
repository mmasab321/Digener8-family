import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BuildDetailView } from "../BuildDetailView";

export default async function BuildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const build = await prisma.build.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      checklistItems: { orderBy: { order: "asc" } },
    },
  });
  if (!build) notFound();

  const role = (session.user as { role?: string }).role ?? "";
  const canEdit = role === "Admin" || role === "Manager";

  const serialized = JSON.parse(JSON.stringify(build));

  return (
    <div className="space-y-4">
      <BuildDetailView build={serialized} canEdit={canEdit} />
    </div>
  );
}
