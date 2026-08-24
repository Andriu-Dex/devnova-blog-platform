"use server";

import { requireAdmin } from "@/server/auth/authorization";
import { db } from "@/server/db";
import { userCredentials, auditEvents, auditUserEvents, auditActionTypes } from "@/server/db/schema";
import { verifyPassword, hashPassword, validatePasswordForHashing } from "@/server/security/password";
import { revokeAllUserSessions } from "@/server/auth/session-service";
import { deleteSessionCookie } from "@/server/auth/auth-cookie";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import net from "node:net";
import { redirect } from "next/navigation";

export async function changeOwnPasswordAction(prevState: unknown, formData: FormData) {
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof currentPassword !== "string" || !currentPassword) {
    return { error: "La contraseña actual es requerida." };
  }
  if (typeof newPassword !== "string" || !newPassword) {
    return { error: "La nueva contraseña es requerida." };
  }
  if (typeof confirmPassword !== "string" || !confirmPassword) {
    return { error: "Debe confirmar la nueva contraseña." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "La confirmación no coincide con la nueva contraseña." };
  }

  try {
    validatePasswordForHashing(newPassword);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "La contraseña no cumple con los requisitos." };
  }

  const admin = await requireAdmin();

  try {
    // Check current password
    const creds = await db.select().from(userCredentials).where(eq(userCredentials.userId, admin.id)).limit(1);
    if (!creds.length) {
      return { error: "No fue posible verificar la contraseña actual." };
    }

    const isCurrentValid = await verifyPassword(creds[0].passwordHash, currentPassword);
    if (!isCurrentValid) {
      return { error: "No fue posible verificar la contraseña actual." };
    }

    // Check if new password is the same as current
    const isSameAsCurrent = await verifyPassword(creds[0].passwordHash, newPassword);
    if (isSameAsCurrent) {
      return { error: "La nueva contraseña debe ser diferente de la actual." };
    }

    const newHash = await hashPassword(newPassword);

    // Get Metadata
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    let ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || null;
    if (ipAddress && !net.isIP(ipAddress)) {
      ipAddress = null;
    }
    let userAgent = headersList.get("user-agent") || null;
    if (userAgent && userAgent.length > 1024) {
      userAgent = userAgent.substring(0, 1024);
    }

    await db.transaction(async (tx) => {
      // 1. Update user_credentials
      await tx.update(userCredentials)
        .set({
          passwordHash: newHash,
          mustChangePassword: false,
          passwordChangedAt: new Date()
        })
        .where(eq(userCredentials.userId, admin.id));

      // 2. Obtain action type
      const actionType = await tx.select().from(auditActionTypes).where(eq(auditActionTypes.code, "PASSWORD_CHANGE")).limit(1);
      if (!actionType.length) {
        throw new Error("Missing PASSWORD_CHANGE action type");
      }

      // 3. Create audit_events
      const [audit] = await tx.insert(auditEvents).values({
        actorUserId: admin.id,
        actionTypeId: actionType[0].id,
        ipAddress,
        userAgent
      }).returning({ id: auditEvents.id });

      // 4. Create audit_user_events
      await tx.insert(auditUserEvents).values({
        auditEventId: audit.id,
        targetUserId: admin.id,
        previousStatusId: null,
        newStatusId: null
      });
    });

    // Post-transaction
    await revokeAllUserSessions(admin.id);
    await deleteSessionCookie();

  } catch (error) {
    console.error("changeOwnPasswordAction failed:", error);
    return { error: "No fue posible actualizar la contraseña en este momento." };
  }

  // Redirect to login explicitly catching the Next.js navigation error
  redirect("/login?passwordChanged=1");
}
