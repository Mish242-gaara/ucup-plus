import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function logAudit(
  action: string,
  entityType: string,
  entityId?: number,
  detail?: Record<string, unknown>
) {
  const session = await getSession();

  await prisma.auditLog.create({
    data: {
      actorEmail: session?.email ?? "unknown",
      action,
      entityType,
      entityId,
      detail: detail ? JSON.stringify(detail) : null,
    },
  });
}
