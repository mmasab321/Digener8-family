import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = (session.user as { role?: string })?.role ?? "";
  if (["Admin", "Manager"].includes(role)) redirect("/dashboard");
  if (role === "Contributor") redirect("/tasks");
  redirect("/my-tasks");
}
