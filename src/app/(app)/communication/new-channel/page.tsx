import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NewChannelForm } from "../NewChannelForm";

export default async function NewChannelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const categories = await prisma.channelCategory.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-semibold text-white mb-2">Create channel</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Add a new channel.
      </p>
      <NewChannelForm categories={categories} />
    </div>
  );
}
