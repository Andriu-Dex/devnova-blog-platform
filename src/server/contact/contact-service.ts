import { db } from "@/server/db";
import {
  contactMessages,
  contactMessageStatuses,
  contactMessageStatusHistory,
  auditActionTypes,
  auditEvents,
  auditContactMessageEvents,
  users
} from "@/server/db/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { getRequestMetadata } from "@/server/utils/request-metadata";

export async function createContactMessage(data: {
  senderName: string;
  senderEmail: string;
  subject: string;
  messageBody: string;
}) {
  return await db.transaction(async (tx) => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const reqMeta = await getRequestMetadata();

    // 1. Resolver estado NEW (y action type para rate limit/audit)
    const newStatusRes = await tx.select().from(contactMessageStatuses).where(eq(contactMessageStatuses.code, "NEW"));
    const newStatus = newStatusRes[0];
    if (!newStatus) throw new Error("Estado NEW no encontrado en base de datos.");

    const actionTypeRes = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "CREATE"));
    const createActionId = actionTypeRes[0]?.id;
    if (!createActionId) throw new Error("Acción CREATE no encontrada en auditoría.");

    // Rate Limit 1: IP Based (max 5 CREATE requests in 10 minutes)
    if (reqMeta.ipAddress) {
      const recentIpRes = await tx.execute(sql`
        SELECT COUNT(*) as count 
        FROM audit_events ae
        JOIN audit_contact_message_events acme ON ae.id = acme.audit_event_id
        WHERE ae.action_type_id = ${createActionId}
          AND ae.ip_address = ${reqMeta.ipAddress}
          AND ae.occurred_at >= ${tenMinutesAgo.toISOString()}
      `);
      const recentIpCount = Number(recentIpRes[0]?.count || 0);
      if (recentIpCount >= 5) {
        throw new Error("Has enviado varios mensajes recientemente. Inténtalo nuevamente más tarde.");
      }
    }

    // Rate Limit 2: Email Based (max 3 messages from same email in 10 minutes)
    const normalizedEmail = data.senderEmail.trim().toLowerCase();
    const recentEmailRes = await tx.execute(sql`
        SELECT COUNT(*) as count 
        FROM contact_messages
        WHERE lower(sender_email) = ${normalizedEmail}
          AND received_at >= ${tenMinutesAgo.toISOString()}
    `);
    const recentEmailCount = Number(recentEmailRes[0]?.count || 0);
    if (recentEmailCount >= 3) {
      throw new Error("Has enviado varios mensajes recientemente. Inténtalo nuevamente más tarde.");
    }

    // 2. Insertar contact_messages
    const msgRes = await tx.insert(contactMessages).values({
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      subject: data.subject,
      messageBody: data.messageBody,
    }).returning({ id: contactMessages.id });
    const newMessageId = msgRes[0].id;

    // 3. Insertar historial inicial (sequence 1)
    const historyRes = await tx.insert(contactMessageStatusHistory).values({
      contactMessageId: newMessageId,
      sequenceNumber: 1,
      statusId: newStatus.id,
      changedByUserId: null,
    }).returning({ id: contactMessageStatusHistory.id });
    const newHistoryId = historyRes[0].id;

    // 4. Auditoría CREATE
    const auditRes = await tx.insert(auditEvents).values({
      actionTypeId: createActionId,
      actorUserId: null, // Público
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    }).returning({ id: auditEvents.id });

    await tx.insert(auditContactMessageEvents).values({
      auditEventId: auditRes[0].id,
      contactMessageId: newMessageId,
      previousStatusHistoryId: null,
      newStatusHistoryId: newHistoryId,
    });

    return newMessageId;
  });
}

export async function listAdminMessages(page: number, pageSize: number, statusFilterCode?: string) {
  // Obtenemos la última secuencia
  const latestSubquery = db
    .select({
      contactMessageId: contactMessageStatusHistory.contactMessageId,
      maxSeq: sql<number>`MAX(${contactMessageStatusHistory.sequenceNumber})`.as("max_seq")
    })
    .from(contactMessageStatusHistory)
    .groupBy(contactMessageStatusHistory.contactMessageId)
    .as("latest_seqs");

  const baseQuery = db
    .select({
      id: contactMessages.id,
      senderName: contactMessages.senderName,
      senderEmail: contactMessages.senderEmail,
      subject: contactMessages.subject,
      receivedAt: contactMessages.receivedAt,
      currentStatusId: contactMessageStatuses.id,
      currentStatusCode: contactMessageStatuses.code,
      currentStatusName: contactMessageStatuses.name,
    })
    .from(contactMessages)
    .innerJoin(latestSubquery, eq(contactMessages.id, latestSubquery.contactMessageId))
    .innerJoin(
      contactMessageStatusHistory,
      and(
        eq(contactMessageStatusHistory.contactMessageId, latestSubquery.contactMessageId),
        eq(contactMessageStatusHistory.sequenceNumber, latestSubquery.maxSeq)
      )
    )
    .innerJoin(contactMessageStatuses, eq(contactMessageStatusHistory.statusId, contactMessageStatuses.id));

  // Build the conditions array
  const conditions = [];
  if (statusFilterCode) {
    conditions.push(eq(contactMessageStatuses.code, statusFilterCode));
  }

  // Count query
  const countQuery = db
    .select({ count: count() })
    .from(contactMessages)
    .innerJoin(latestSubquery, eq(contactMessages.id, latestSubquery.contactMessageId))
    .innerJoin(
      contactMessageStatusHistory,
      and(
        eq(contactMessageStatusHistory.contactMessageId, latestSubquery.contactMessageId),
        eq(contactMessageStatusHistory.sequenceNumber, latestSubquery.maxSeq)
      )
    )
    .innerJoin(contactMessageStatuses, eq(contactMessageStatusHistory.statusId, contactMessageStatuses.id));
    
  if (conditions.length > 0) {
    countQuery.where(and(...conditions));
  }

  const [{ count: totalCount }] = await countQuery;

  // Data query
  if (conditions.length > 0) {
    baseQuery.where(and(...conditions));
  }

  const offset = (page - 1) * pageSize;
  const rows = await baseQuery
    .orderBy(desc(contactMessages.receivedAt))
    .limit(pageSize)
    .offset(offset);

  return { rows, totalCount };
}

export async function getAdminMessageDetail(messageId: string) {
  const root = await db.select().from(contactMessages).where(eq(contactMessages.id, messageId));
  if (!root[0]) return null;
  const message = root[0];

  const historyRows = await db
    .select({
      id: contactMessageStatusHistory.id,
      sequenceNumber: contactMessageStatusHistory.sequenceNumber,
      changedAt: contactMessageStatusHistory.changedAt,
      statusCode: contactMessageStatuses.code,
      statusName: contactMessageStatuses.name,
      actorId: users.id,
      actorName: users.displayName,
    })
    .from(contactMessageStatusHistory)
    .innerJoin(contactMessageStatuses, eq(contactMessageStatusHistory.statusId, contactMessageStatuses.id))
    .leftJoin(users, eq(contactMessageStatusHistory.changedByUserId, users.id))
    .where(eq(contactMessageStatusHistory.contactMessageId, messageId))
    .orderBy(contactMessageStatusHistory.sequenceNumber);

  return {
    ...message,
    history: historyRows,
    currentStatus: historyRows[historyRows.length - 1]
  };
}

export type ContactMessageTransitionTarget = "READ" | "ARCHIVED";

export async function transitionMessageStatus(
  adminUserId: string,
  messageId: string,
  targetStatusCode: ContactMessageTransitionTarget
) {
  if (targetStatusCode !== "READ" && targetStatusCode !== "ARCHIVED") {
    throw new Error("Transición de estado no válida.");
  }

  await db.transaction(async (tx) => {
    // 1. Lock root FOR UPDATE
    const msgRows = await tx.select().from(contactMessages).where(eq(contactMessages.id, messageId)).for("update");
    if (!msgRows[0]) throw new Error("Mensaje no encontrado.");

    // 2. Obtener estado actual autoritativo
    const latestRows = await tx
      .select({
        id: contactMessageStatusHistory.id,
        sequenceNumber: contactMessageStatusHistory.sequenceNumber,
        statusCode: contactMessageStatuses.code
      })
      .from(contactMessageStatusHistory)
      .innerJoin(contactMessageStatuses, eq(contactMessageStatusHistory.statusId, contactMessageStatuses.id))
      .where(eq(contactMessageStatusHistory.contactMessageId, messageId))
      .orderBy(desc(contactMessageStatusHistory.sequenceNumber))
      .limit(1);

    const latest = latestRows[0];
    if (!latest) throw new Error("Estado actual no encontrado.");

    // 3. Idempotencia y validación de transiciones
    if (latest.statusCode === targetStatusCode) {
      return; // no-op idempotente
    }

    if (targetStatusCode === "READ" && latest.statusCode !== "NEW") {
      throw new Error("Transición inválida: Solo se pueden marcar como leídos los mensajes NUEVOS.");
    }
    
    if (targetStatusCode === "ARCHIVED" && latest.statusCode !== "READ") {
      throw new Error("Este mensaje debe estar leído antes de archivarse.");
    }

    // 4. Resolver nuevo status
    const targetStatusRes = await tx.select().from(contactMessageStatuses).where(eq(contactMessageStatuses.code, targetStatusCode));
    const targetStatus = targetStatusRes[0];
    if (!targetStatus) throw new Error("Target status no encontrado en base de datos.");

    // 5. Insertar nueva historia
    const historyRes = await tx.insert(contactMessageStatusHistory).values({
      contactMessageId: messageId,
      sequenceNumber: latest.sequenceNumber + 1,
      statusId: targetStatus.id,
      changedByUserId: adminUserId,
    }).returning({ id: contactMessageStatusHistory.id });
    const newHistoryId = historyRes[0].id;

    // 6. Auditoría
    const reqMeta = await getRequestMetadata();
    const actionTypeRes = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "STATUS_CHANGE"));
    const auditRes = await tx.insert(auditEvents).values({
      actionTypeId: actionTypeRes[0].id,
      actorUserId: adminUserId,
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    }).returning({ id: auditEvents.id });

    await tx.insert(auditContactMessageEvents).values({
      auditEventId: auditRes[0].id,
      contactMessageId: messageId,
      previousStatusHistoryId: latest.id,
      newStatusHistoryId: newHistoryId,
    });
  });
}

export async function countNewMessages(): Promise<number> {
  const latestSubquery = db
    .select({
      contactMessageId: contactMessageStatusHistory.contactMessageId,
      maxSeq: sql<number>`max(${contactMessageStatusHistory.sequenceNumber})`.as("max_seq"),
    })
    .from(contactMessageStatusHistory)
    .groupBy(contactMessageStatusHistory.contactMessageId)
    .as("latest_seqs");

  const countQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactMessages)
    .innerJoin(latestSubquery, eq(contactMessages.id, latestSubquery.contactMessageId))
    .innerJoin(
      contactMessageStatusHistory,
      and(
        eq(contactMessageStatusHistory.contactMessageId, latestSubquery.contactMessageId),
        eq(contactMessageStatusHistory.sequenceNumber, latestSubquery.maxSeq)
      )
    )
    .innerJoin(contactMessageStatuses, eq(contactMessageStatusHistory.statusId, contactMessageStatuses.id))
    .where(eq(contactMessageStatuses.code, "NEW"));

  return Number(countQuery[0]?.count || 0);
}

export async function exportMessagesForCsv(statusFilterCode?: string) {
  const latestSubquery = db
    .select({
      contactMessageId: contactMessageStatusHistory.contactMessageId,
      maxSeq: sql<number>`MAX(${contactMessageStatusHistory.sequenceNumber})`.as("max_seq")
    })
    .from(contactMessageStatusHistory)
    .groupBy(contactMessageStatusHistory.contactMessageId)
    .as("latest_seqs");

  const baseQuery = db
    .select({
      receivedAt: contactMessages.receivedAt,
      senderName: contactMessages.senderName,
      senderEmail: contactMessages.senderEmail,
      subject: contactMessages.subject,
      currentStatusCode: contactMessageStatuses.code,
    })
    .from(contactMessages)
    .innerJoin(latestSubquery, eq(contactMessages.id, latestSubquery.contactMessageId))
    .innerJoin(
      contactMessageStatusHistory,
      and(
        eq(contactMessageStatusHistory.contactMessageId, latestSubquery.contactMessageId),
        eq(contactMessageStatusHistory.sequenceNumber, latestSubquery.maxSeq)
      )
    )
    .innerJoin(contactMessageStatuses, eq(contactMessageStatusHistory.statusId, contactMessageStatuses.id));

  const conditions = [];
  if (statusFilterCode) {
    conditions.push(eq(contactMessageStatuses.code, statusFilterCode));
  }

  const results = await baseQuery
    .where(and(...conditions))
    .orderBy(desc(contactMessages.receivedAt))
    .limit(5000);
    
  return results;
}

