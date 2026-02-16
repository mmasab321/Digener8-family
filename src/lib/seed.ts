import { hash } from "bcryptjs";
import { prisma } from "./prisma";

export async function runSeed(): Promise<{ ok: boolean; message: string }> {
  const roles = await Promise.all(
    ["Admin", "Manager", "Contributor", "Viewer"].map((name) =>
      prisma.role.upsert({
        where: { name },
        create: {
          name,
          permissions: JSON.stringify([
            ...(name === "Admin"
              ? ["admin:users", "admin:roles", "admin:categories", "admin:metrics", "admin:pipelines", "admin:channels", "admin:settings"]
              : []),
            ...(["Admin", "Manager"].includes(name) ? ["manage:tasks", "manage:pipeline", "manage:metrics"] : []),
            ...(["Admin", "Manager", "Contributor"].includes(name) ? ["create:sop", "edit:sop"] : []),
            "view:all",
          ]),
        },
        update: {},
      })
    )
  );

  const adminRole = roles.find((r) => r.name === "Admin")!;
  const existing = await prisma.user.findUnique({ where: { email: "admin@degener8.com" } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: "admin@degener8.com",
        name: "Admin",
        passwordHash: await hash("admin123", 10),
        roleId: adminRole.id,
      },
    });
  }

  const defaultCategories = [
    { name: "Growth", slug: "growth", description: "Growth initiatives", color: "#22c55e" },
    { name: "Client Projects", slug: "client-projects", description: "Client work", color: "#3b82f6" },
    { name: "Internal Assets", slug: "internal-assets", description: "Internal resources", color: "#8b5cf6" },
    { name: "Content", slug: "content", description: "Content production", color: "#f59e0b" },
    { name: "R&D", slug: "r-d", description: "Research and development", color: "#ec4899" },
    { name: "Operations", slug: "operations", description: "Operations", color: "#64748b" },
  ];
  for (const cat of defaultCategories) {
    await prisma.category.upsert({ where: { slug: cat.slug }, create: cat, update: {} });
  }

  const channelCategories = [
    { name: "Topics", slug: "topics", order: 0 },
    { name: "Projects", slug: "projects", order: 1 },
    { name: "Announcements", slug: "announcements", order: 2 },
    { name: "Strategy", slug: "strategy", order: 3 },
    { name: "Operations", slug: "operations", order: 4 },
  ];
  for (const cc of channelCategories) {
    await prisma.channelCategory.upsert({ where: { slug: cc.slug }, create: cc, update: {} });
  }

  const topicsCategory = await prisma.channelCategory.findUnique({ where: { slug: "topics" } });
  const projectsCategory = await prisma.channelCategory.findUnique({ where: { slug: "projects" } });
  const defaultChannels = [
    { name: "general", slug: "general", description: "General discussion", channelCategoryId: topicsCategory?.id ?? null },
    { name: "projects", slug: "projects", description: "Project updates", channelCategoryId: projectsCategory?.id ?? null },
    { name: "growth", slug: "growth", description: "Growth and experiments", channelCategoryId: topicsCategory?.id ?? null },
  ];
  for (const ch of defaultChannels) {
    await prisma.channel.upsert({
      where: { slug: ch.slug },
      create: { ...ch, visibility: "public", type: "normal" },
      update: {},
    });
  }

  return { ok: true, message: "Seeded. Log in as admin@degener8.com / admin123" };
}
