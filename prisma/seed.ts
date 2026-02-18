import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const roles = await Promise.all(
    ["Admin", "Manager", "Contributor", "Viewer"].map((name, i) =>
      prisma.role.upsert({
        where: { name },
        create: {
          name,
          permissions: JSON.stringify([
            ...(name === "Admin" ? ["admin:users", "admin:roles", "admin:categories", "admin:metrics", "admin:pipelines", "admin:channels", "admin:settings"] : []),
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
    console.log("Created admin user: admin@degener8.com / admin123");
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
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: {},
    });
  }

  const channelCategories = [
    { name: "Topics", slug: "topics", order: 0 },
    { name: "Projects", slug: "projects", order: 1 },
    { name: "Announcements", slug: "announcements", order: 2 },
    { name: "Strategy", slug: "strategy", order: 3 },
    { name: "Operations", slug: "operations", order: 4 },
  ];
  for (const cc of channelCategories) {
    await prisma.channelCategory.upsert({
      where: { slug: cc.slug },
      create: cc,
      update: {},
    });
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
  // Service catalog (Clients module) — upsert-safe
  const serviceCategoriesData = [
    { name: "High Performance Creative Studio", slug: "high-performance-creative-studio", order: 1 },
    { name: "Content Growth Engines", slug: "content-growth-engines", order: 2 },
    { name: "Digital Architecture & Web Systems", slug: "digital-architecture-web-systems", order: 3 },
    { name: "The Autonomous Workforce", slug: "the-autonomous-workforce", order: 4 },
  ];
  for (const cat of serviceCategoriesData) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: {},
    });
  }

  const cat01 = await prisma.serviceCategory.findUnique({ where: { slug: "high-performance-creative-studio" } });
  const cat02 = await prisma.serviceCategory.findUnique({ where: { slug: "content-growth-engines" } });
  const cat03 = await prisma.serviceCategory.findUnique({ where: { slug: "digital-architecture-web-systems" } });
  const cat04 = await prisma.serviceCategory.findUnique({ where: { slug: "the-autonomous-workforce" } });

  const servicesData: { name: string; slug: string; serviceCategoryId: string }[] = [];
  if (cat01) {
    ["Video Editing", "Graphic Designing", "Script Writing", "Social Media Management"].forEach((name, i) => {
      servicesData.push({
        name,
        slug: `high-performance-creative-studio-${name.toLowerCase().replace(/\s+/g, "-")}`,
        serviceCategoryId: cat01.id,
      });
    });
  }
  if (cat02) {
    ["AI Content Creation", "YouTube & Social Media", "Automation", "Platform Monetization"].forEach((name, i) => {
      servicesData.push({
        name,
        slug: `content-growth-engines-${name.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and")}`,
        serviceCategoryId: cat02.id,
      });
    });
  }
  if (cat03) {
    ["Website Designing", "Website Development", "Digital Ecosystem Strategy"].forEach((name) => {
      servicesData.push({
        name,
        slug: `digital-architecture-${name.toLowerCase().replace(/\s+/g, "-")}`,
        serviceCategoryId: cat03.id,
      });
    });
  }
  if (cat04) {
    ["Autonomous Chatbots", "AI Calling Agents", "Business Process Automation"].forEach((name) => {
      servicesData.push({
        name,
        slug: `autonomous-workforce-${name.toLowerCase().replace(/\s+/g, "-")}`,
        serviceCategoryId: cat04.id,
      });
    });
  }

  for (const svc of servicesData) {
    await prisma.service.upsert({
      where: { slug: svc.slug },
      create: svc,
      update: {},
    });
  }
  console.log("Seeded roles, categories, channel categories, default channels, and service catalog.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
