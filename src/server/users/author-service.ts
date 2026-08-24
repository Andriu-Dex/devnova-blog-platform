import "server-only";
import { db } from "../db";
import {
  users,
  roles,
  userStatuses,
  userCredentials,
  auditEvents,
  auditUserEvents,
  auditActionTypes,
  userSessions
} from "../db/schema";
import { eq, and, desc, sql, ilike } from "drizzle-orm";
import { hashPassword } from "../security/password";
import crypto from "node:crypto";
import { AuthMetadata } from "../auth/types";

export interface AuthorListItem {
  id: string;
  username: string;
  displayName: string;
  status: string;
  createdAt: Date;
  mustChangePassword: true | false;
}

export async function listAuthors(): Promise<AuthorListItem[]> {
  const result = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      status: userStatuses.code,
      createdAt: users.createdAt,
      mustChangePassword: userCredentials.mustChangePassword,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .innerJoin(userStatuses, eq(users.statusId, userStatuses.id))
    .innerJoin(userCredentials, eq(users.id, userCredentials.userId))
    .where(eq(roles.code, "AUTHOR"))
    .orderBy(desc(users.createdAt));

  return result;
}

export async function createAuthor(
  username: string,
  displayName: string,
  currentAdminId: string,
  metadata: AuthMetadata
): Promise<{ temporaryPassword?: string; error?: string }> {
  const cleanUsername = username.trim();
  const cleanDisplayName = displayName.trim();

  if (cleanUsername.length < 1 || cleanUsername.length > 80) {
    return { error: "El nombre de usuario debe tener entre 1 y 80 caracteres." };
  }
  if (cleanDisplayName.length < 1 || cleanDisplayName.length > 120) {
    return { error: "El nombre para mostrar debe tener entre 1 y 120 caracteres." };
  }

  // Generate temporary password
  const temporaryPassword = crypto.randomBytes(18).toString("base64url");
  const passwordHash = await hashPassword(temporaryPassword);

  try {
    await db.transaction(async (tx) => {
      // Fetch essential IDs
      const authorRole = await tx.select({ id: roles.id }).from(roles).where(eq(roles.code, "AUTHOR")).limit(1);
      const activeStatus = await tx.select({ id: userStatuses.id }).from(userStatuses).where(eq(userStatuses.code, "ACTIVE")).limit(1);
      const createAction = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "CREATE")).limit(1);

      if (!authorRole.length || !activeStatus.length || !createAction.length) {
        throw new Error("Missing core catalog data.");
      }

      // Check friendly duplicate
      const existing = await tx.select({ id: users.id }).from(users).where(ilike(users.username, cleanUsername)).limit(1);
      if (existing.length > 0) {
        throw new Error("DUPLICATE_USERNAME");
      }

      // 1. Insert user
      const [newUser] = await tx.insert(users).values({
        username: cleanUsername,
        displayName: cleanDisplayName,
        roleId: authorRole[0].id,
        statusId: activeStatus[0].id,
        createdByUserId: currentAdminId,
      }).returning({ id: users.id });

      // 2. Insert credentials
      await tx.insert(userCredentials).values({
        userId: newUser.id,
        passwordHash,
        mustChangePassword: true,
        passwordChangedAt: new Date(),
      });

      // 3. Insert audit_events
      const [audit] = await tx.insert(auditEvents).values({
        actorUserId: currentAdminId,
        actionTypeId: createAction[0].id,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      }).returning({ id: auditEvents.id });

      // 4. Insert audit_user_events
      await tx.insert(auditUserEvents).values({
        auditEventId: audit.id,
        targetUserId: newUser.id,
        previousStatusId: null,
        newStatusId: activeStatus[0].id,
      });
    });

    return { temporaryPassword };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "DUPLICATE_USERNAME") {
      return { error: "El nombre de usuario ya está en uso." };
    }
    // Handle SQLSTATE 23505 (unique_violation)
    if (typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === "23505") {
      return { error: "El nombre de usuario ya está en uso." };
    }
    console.error("createAuthor failed:", err);
    return { error: "No fue posible completar la operación." };
  }
}

export async function blockAuthor(targetUserId: string, currentAdminId: string, metadata: AuthMetadata): Promise<{ error?: string }> {
  try {
    await db.transaction(async (tx) => {
      // Validate target is AUTHOR
      const targetUser = await tx.select({
        id: users.id,
        roleCode: roles.code,
        statusId: users.statusId,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, targetUserId))
      .limit(1);

      if (!targetUser.length || targetUser[0].roleCode !== "AUTHOR") {
        throw new Error("Invalid target user.");
      }

      const activeStatus = await tx.select({ id: userStatuses.id }).from(userStatuses).where(eq(userStatuses.code, "ACTIVE")).limit(1);
      const blockedStatus = await tx.select({ id: userStatuses.id }).from(userStatuses).where(eq(userStatuses.code, "BLOCKED")).limit(1);
      const blockAction = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "BLOCK")).limit(1);

      if (!activeStatus.length || !blockedStatus.length || !blockAction.length) {
        throw new Error("Missing core catalog data.");
      }

      if (targetUser[0].statusId === blockedStatus[0].id) {
        // Idempotent no-op
        return;
      }

      // 1. UPDATE users
      await tx.update(users).set({ statusId: blockedStatus[0].id }).where(eq(users.id, targetUserId));

      // 2. UPDATE user_sessions
      await tx.update(userSessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(userSessions.userId, targetUserId), sql`revoked_at IS NULL`));

      // 3. INSERT audit_events
      const [audit] = await tx.insert(auditEvents).values({
        actorUserId: currentAdminId,
        actionTypeId: blockAction[0].id,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      }).returning({ id: auditEvents.id });

      // 4. INSERT audit_user_events
      await tx.insert(auditUserEvents).values({
        auditEventId: audit.id,
        targetUserId: targetUserId,
        previousStatusId: activeStatus[0].id,
        newStatusId: blockedStatus[0].id,
      });
    });
    return {};
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Invalid target user.") {
      return { error: "No fue posible completar la operación. Usuario inválido." };
    }
    console.error("blockAuthor failed:", err);
    return { error: "No fue posible completar la operación." };
  }
}

export async function reactivateAuthor(targetUserId: string, currentAdminId: string, metadata: AuthMetadata): Promise<{ error?: string }> {
  try {
    await db.transaction(async (tx) => {
      // Validate target is AUTHOR
      const targetUser = await tx.select({
        id: users.id,
        roleCode: roles.code,
        statusId: users.statusId,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, targetUserId))
      .limit(1);

      if (!targetUser.length || targetUser[0].roleCode !== "AUTHOR") {
        throw new Error("Invalid target user.");
      }

      const activeStatus = await tx.select({ id: userStatuses.id }).from(userStatuses).where(eq(userStatuses.code, "ACTIVE")).limit(1);
      const blockedStatus = await tx.select({ id: userStatuses.id }).from(userStatuses).where(eq(userStatuses.code, "BLOCKED")).limit(1);
      const unblockAction = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "UNBLOCK")).limit(1);

      if (!activeStatus.length || !blockedStatus.length || !unblockAction.length) {
        throw new Error("Missing core catalog data.");
      }

      if (targetUser[0].statusId === activeStatus[0].id) {
        // Idempotent no-op
        return;
      }

      // 1. UPDATE users
      await tx.update(users).set({ statusId: activeStatus[0].id }).where(eq(users.id, targetUserId));

      // 2. INSERT audit_events
      const [audit] = await tx.insert(auditEvents).values({
        actorUserId: currentAdminId,
        actionTypeId: unblockAction[0].id,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      }).returning({ id: auditEvents.id });

      // 3. INSERT audit_user_events
      await tx.insert(auditUserEvents).values({
        auditEventId: audit.id,
        targetUserId: targetUserId,
        previousStatusId: blockedStatus[0].id,
        newStatusId: activeStatus[0].id,
      });
    });
    return {};
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Invalid target user.") {
      return { error: "No fue posible completar la operación. Usuario inválido." };
    }
    console.error("reactivateAuthor failed:", err);
    return { error: "No fue posible completar la operación." };
  }
}

export async function resetAuthorTemporaryPassword(targetUserId: string, currentAdminId: string, metadata: AuthMetadata): Promise<{ temporaryPassword?: string; error?: string }> {
  try {
    const temporaryPassword = crypto.randomBytes(18).toString("base64url");
    const passwordHash = await hashPassword(temporaryPassword);

    await db.transaction(async (tx) => {
      // Validate target is AUTHOR
      const targetUser = await tx.select({
        id: users.id,
        roleCode: roles.code,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, targetUserId))
      .limit(1);

      if (!targetUser.length || targetUser[0].roleCode !== "AUTHOR") {
        throw new Error("Invalid target user.");
      }

      const passwordChangeAction = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "PASSWORD_CHANGE")).limit(1);
      if (!passwordChangeAction.length) {
        throw new Error("Missing PASSWORD_CHANGE catalog data.");
      }

      // 1. UPDATE user_credentials
      await tx.update(userCredentials)
        .set({
          passwordHash,
          mustChangePassword: true,
          passwordChangedAt: new Date(),
        })
        .where(eq(userCredentials.userId, targetUserId));

      // 2. UPDATE user_sessions (revoke all unrevoked)
      await tx.update(userSessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(userSessions.userId, targetUserId), sql`revoked_at IS NULL`));

      // 3. INSERT audit_events
      const [audit] = await tx.insert(auditEvents).values({
        actorUserId: currentAdminId,
        actionTypeId: passwordChangeAction[0].id,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      }).returning({ id: auditEvents.id });

      // 4. INSERT audit_user_events
      await tx.insert(auditUserEvents).values({
        auditEventId: audit.id,
        targetUserId: targetUserId,
        previousStatusId: null,
        newStatusId: null,
      });
    });

    return { temporaryPassword };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Invalid target user.") {
      return { error: "No fue posible completar la operación. Usuario inválido." };
    }
    console.error("resetAuthorTemporaryPassword failed:", err);
    return { error: "No fue posible completar la operación." };
  }
}
