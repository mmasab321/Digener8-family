import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/auth";
import { NewChannelForm } from "../NewChannelForm";

export default async function NewChannelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "";
  if (!hasPermission(role, "admin:channels") && role !== "Manager")
    redirect("/communication");

  const categories = await prisma.channelCategory.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-semibold text-white mb-2">Create channel</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Add a new channel. Only admins can create; managers can request.
      </p>
      <NewChannelForm categories={categories} />
    </div>
  );
}
