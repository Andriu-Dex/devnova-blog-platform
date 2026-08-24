import "server-only";
import { db } from "../db";
import {
  userCredentials,
  userSessions,
  auditEvents,
  auditUserEvents,
  auditActionTypes
} from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../security/password";
import { AuthMetadata } from "../auth/types";

export async function completeRequiredPasswordChange(
  userId: string,
  currentPasswordRaw: string,
  newPasswordRaw: string,
  metadata: AuthMetadata
): Promise<{ success?: boolean; error?: string }> {
  try {
    const creds = await db
      .select({ passwordHash: userCredentials.passwordHash })
      .from(userCredentials)
      .where(eq(userCredentials.userId, userId))
      .limit(1);

    if (!creds.length) {
      return { error: "No fue posible verificar la contraseña actual." };
    }

    const isCurrentValid = await verifyPassword(creds[0].passwordHash, currentPasswordRaw);
    if (!isCurrentValid) {
      return { error: "No fue posible verificar la contraseña actual." };
    }

    const isSameAsCurrent = await verifyPassword(creds[0].passwordHash, newPasswordRaw);
    if (isSameAsCurrent) {
      return { error: "La nueva contraseña debe ser diferente de la actual." };
    }

    const newHash = await hashPassword(newPasswordRaw);

    await db.transaction(async (tx) => {
      const passwordChangeAction = await tx
        .select({ id: auditActionTypes.id })
        .from(auditActionTypes)
        .where(eq(auditActionTypes.code, "PASSWORD_CHANGE"))
        .limit(1);

      if (!passwordChangeAction.length) {
        throw new Error("Missing PASSWORD_CHANGE catalog data.");
      }

      // 1. Update user_credentials
      await tx.update(userCredentials)
        .set({
          passwordHash: newHash,
          mustChangePassword: false,
          passwordChangedAt: new Date(),
        })
        .where(eq(userCredentials.userId, userId));

      // 2. Revoke all sessions (including current one)
      await tx.update(userSessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(userSessions.userId, userId), sql`revoked_at IS NULL`));

      // 3. Insert audit_events (actor === target)
      const [audit] = await tx.insert(auditEvents).values({
        actorUserId: userId,
        actionTypeId: passwordChangeAction[0].id,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      }).returning({ id: auditEvents.id });

      // 4. Insert audit_user_events
      await tx.insert(auditUserEvents).values({
        auditEventId: audit.id,
        targetUserId: userId,
        previousStatusId: null,
        newStatusId: null,
      });
    });

    return { success: true };
  } catch (error) {
    console.error("completeRequiredPasswordChange failed:", error);
    return { error: "No fue posible actualizar la contraseña en este momento." };
  }
}
