import "server-only";
import { db } from "../db";
import {
  userSessions,
  users,
  roles,
  userStatuses,
  userCredentials,
  auditEvents,
  auditActionTypes,
  auditAuthEvents,
} from "../db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { hashSessionToken, generateSessionToken } from "./session-token";
import { SESSION_DURATION_SECONDS } from "./constants";
import { AuthenticatedUser, RoleCode, StatusCode, AuthMetadata } from "./types";

/**
 * Registra un login exitoso y crea la sesión en una transacción atómica.
 */
export async function createSession(userId: string, attemptedUsername: string, metadata: AuthMetadata) {
  return await db.transaction(async (tx) => {
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

    // 1. Audit LOGIN event
    const actionLogin = await tx
      .select({ id: auditActionTypes.id })
      .from(auditActionTypes)
      .where(eq(auditActionTypes.code, "LOGIN"))
      .limit(1);
    
    if (!actionLogin.length) {
      throw new Error("Missing LOGIN action type in catalogs.");
    }

    const [audit] = await tx
      .insert(auditEvents)
      .values({
        actorUserId: userId,
        actionTypeId: actionLogin[0].id,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      })
      .returning({ id: auditEvents.id });

    // 2. Insert auditAuthEvents
    const limitedUsername = attemptedUsername.substring(0, 80);
    await tx.insert(auditAuthEvents).values({
      auditEventId: audit.id,
      attemptedUsername: limitedUsername,
    });

    // 3. Insert session
    await tx.insert(userSessions).values({
      userId,
      tokenHash,
      expiresAt,
      ipAddress: metadata.ipAddress ?? null,
      userAgent: metadata.userAgent ?? null,
    });

    return { sessionToken: token, expiresAt };
  });
}

/**
 * Resuelve la sesión y extrae el AuthenticatedUser asociado si es válida.
 */
export async function getSessionByToken(token: string): Promise<AuthenticatedUser | null> {
  const tokenHash = hashSessionToken(token);

  const result = await db
    .select({
      user: users,
      role: roles.code,
      status: userStatuses.code,
      cred: userCredentials.mustChangePassword,
      sessionRevokedAt: userSessions.revokedAt,
      sessionExpiresAt: userSessions.expiresAt,
    })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .innerJoin(roles, eq(users.roleId, roles.id))
    .innerJoin(userStatuses, eq(users.statusId, userStatuses.id))
    .innerJoin(userCredentials, eq(users.id, userCredentials.userId))
    .where(
      and(
        eq(userSessions.tokenHash, tokenHash),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (result.length === 0) return null;

  const row = result[0];

  // Si el usuario fue bloqueado después de iniciar sesión, la sesión es inválida
  if (row.status !== "ACTIVE") {
    return null;
  }

  return {
    id: row.user.id,
    username: row.user.username,
    displayName: row.user.displayName,
    role: row.role as RoleCode,
    status: row.status as StatusCode,
    mustChangePassword: row.cred,
  };
}

/**
 * Revoca lógicamente una sesión individual por token.
 */
export async function revokeSessionByToken(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);
  await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(userSessions.tokenHash, tokenHash),
        isNull(userSessions.revokedAt)
      )
    );
}

/**
 * Revoca todas las sesiones de un usuario.
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(userSessions.userId, userId),
        isNull(userSessions.revokedAt)
      )
    );
}
