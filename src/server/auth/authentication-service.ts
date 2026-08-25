import "server-only";
import { db } from "../db";
import {
  users,
  roles,
  userStatuses,
  userCredentials,
  auditEvents,
  auditActionTypes,
  auditAuthEvents,
} from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyPassword } from "../security/password";
import { createSession, getSessionByToken, revokeSessionByToken } from "./session-service";
import { setSessionCookie, getSessionCookie, deleteSessionCookie } from "./auth-cookie";
import { SessionResult, AuthMetadata, AuthenticatedUser } from "./types";
import net from "node:net";

// Este hash dummy precomputado se usa exclusivamente para normalizar el tiempo
// criptográfico de respuesta y prevenir username enumeration (ataques de tiempo).
// NO representa ninguna credencial válida, es Argon2id con la misma config del sistema.
const DUMMY_HASH = "$argon2id$v=19$m=19456,t=2,p=1$gtcRt3yZ550ibSk+lZCrFg$ZJdFs+J8k3shGF/vJleGqQDLa8ohBJgMw3/VpEZBHh4";

export async function authenticateWithPassword(
  rawUsername: string,
  passwordRaw: string,
  rawMetadata: AuthMetadata
): Promise<SessionResult> {
  const username = rawUsername.trim();
  if (!username) return { ok: false, code: "INVALID_CREDENTIALS" };

  const metadata = sanitizeMetadata(rawMetadata);

  // Rate Limiting: 5 fallos en 5 minutos por IP
  if (metadata.ipAddress) {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    // Extraer ID de la acción LOGIN_FAILED de manera subquery o explícita
    const failActionSubquery = db
      .select({ id: auditActionTypes.id })
      .from(auditActionTypes)
      .where(eq(auditActionTypes.code, "LOGIN_FAILED"))
      .limit(1);

    const recentFailsRes = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM ${auditEvents} 
      WHERE ${auditEvents.ipAddress} = ${metadata.ipAddress} 
        AND ${auditEvents.actionTypeId} = (${failActionSubquery})
        AND ${auditEvents.occurredAt} >= ${fiveMinsAgo}
    `);
    
    const recentFails = Number(recentFailsRes[0]?.count || 0);
    if (recentFails >= 5) {
      // Retornar código genérico
      return { ok: false, code: "INVALID_CREDENTIALS" };
    }
  }

  // Rate Limiting: 10 fallos en 15 minutos por Username
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const failActionSubquery = db
    .select({ id: auditActionTypes.id })
    .from(auditActionTypes)
    .where(eq(auditActionTypes.code, "LOGIN_FAILED"))
    .limit(1);

  const recentFailsUserRes = await db.execute(sql`
    SELECT COUNT(*) as count 
    FROM ${auditEvents} ae
    JOIN ${auditAuthEvents} aae ON ae.id = aae.audit_event_id
    WHERE lower(aae.attempted_username) = lower(${username})
      AND ae.action_type_id = (${failActionSubquery})
      AND ae.occurred_at >= ${fifteenMinsAgo}
  `);
  
  const recentFailsUser = Number(recentFailsUserRes[0]?.count || 0);
  if (recentFailsUser >= 10) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  // Consulta case-insensitive a la base de datos
  const userRows = await db
    .select({
      user: users,
      role: roles.code,
      status: userStatuses.code,
      passwordHash: userCredentials.passwordHash,
      mustChangePassword: userCredentials.mustChangePassword,
      passwordChangedAt: userCredentials.passwordChangedAt,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .innerJoin(userStatuses, eq(users.statusId, userStatuses.id))
    .innerJoin(userCredentials, eq(users.id, userCredentials.userId))
    .where(sql`lower(${users.username}) = lower(${username})`)
    .limit(1);

  const row = userRows.length > 0 ? userRows[0] : null;

  // Verificación constante (dummy o real) para prevenir timing attacks
  const hashToVerify = row ? row.passwordHash : DUMMY_HASH;
  const passwordValid = await verifyPassword(hashToVerify, passwordRaw);

  // Fallo de autenticación
  if (!row || !passwordValid || row.status !== "ACTIVE") {
    // Si realmente intentó pero falló (no existe o pass mal o inactivo)
    // Se audita como LOGIN_FAILED
    await logFailedLogin(username, metadata);
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  // Expiración temporal de 72 horas para contraseñas temporales
  if (row.mustChangePassword && row.passwordChangedAt) {
    const ageMs = Date.now() - new Date(row.passwordChangedAt).getTime();
    if (ageMs > 72 * 60 * 60 * 1000) {
      await logFailedLogin(username, metadata);
      return { ok: false, code: "INVALID_CREDENTIALS" };
    }
  }

  // Éxito: Crear sesión y auditar
  const { sessionToken, expiresAt } = await createSession(row.user.id, username, metadata);

  // La cookie sólo puede ser enviada por el framework luego, pero preparamos el helper
  await setSessionCookie(sessionToken, expiresAt);

  return {
    ok: true,
    sessionToken,
    expiresAt,
    user: {
      id: row.user.id,
      username: row.user.username,
      displayName: row.user.displayName,
      role: row.role as import("./types").RoleCode,
      status: row.status as import("./types").StatusCode,
      mustChangePassword: row.mustChangePassword,
    },
  };
}

export async function getCurrentAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  const user = await getSessionByToken(token);
  return user;
}

export async function revokeCurrentSession(): Promise<void> {
  const token = await getSessionCookie();
  if (token) {
    await revokeSessionByToken(token);
    await deleteSessionCookie();
  }
}

// Helpers internos

function sanitizeMetadata(metadata: AuthMetadata): AuthMetadata {
  let ipAddress = metadata.ipAddress?.trim() || null;
  if (ipAddress && !net.isIP(ipAddress)) {
    ipAddress = null;
  }
  
  let userAgent = metadata.userAgent || null;
  if (userAgent && userAgent.length > 1024) {
    userAgent = userAgent.substring(0, 1024);
  }

  return { ipAddress, userAgent };
}

async function logFailedLogin(attemptedUsername: string, metadata: AuthMetadata) {
  try {
    const limitedUsername = attemptedUsername.substring(0, 80); // Límite tabla audit_auth_events

    await db.transaction(async (tx) => {
      const actionFail = await tx
        .select({ id: auditActionTypes.id })
        .from(auditActionTypes)
        .where(eq(auditActionTypes.code, "LOGIN_FAILED"))
        .limit(1);

      if (!actionFail.length) return; // Silent return si no hay catálogo

      const [audit] = await tx
        .insert(auditEvents)
        .values({
          actorUserId: null,
          actionTypeId: actionFail[0].id,
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent ?? null,
        })
        .returning({ id: auditEvents.id });

      await tx.insert(auditAuthEvents).values({
        auditEventId: audit.id,
        attemptedUsername: limitedUsername,
      });
    });
  } catch (error) {
    // Audit no debería botar la app completa en error interno
    console.error("Failed to log failed login:", error);
  }
}
