import { prisma } from "./prisma";

export async function logActivity(
  userId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  categoryId?: string | null,
  metadata?: Record<string, unknown>
) {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      categoryId: categoryId ?? null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
