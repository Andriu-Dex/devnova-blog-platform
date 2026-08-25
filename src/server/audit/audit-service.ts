import "server-only";
import { db } from "../db";
import { 
  auditEvents, 
  auditActionTypes, 
  users, 
  auditAuthEvents,
  auditUserEvents,
  auditBlogEvents,
  auditSiteSectionEvents,
  auditSiteProfileEvents,
  auditTeamMemberEvents,
  auditContactMessageEvents,
  auditSiteSocialLinkEvents,
  auditMediaEvents,
  blogs,
  siteSections,
  teamMembers,
  mediaAssets
} from "../db/schema";
import { desc, eq, and, sql, gte, lte } from "drizzle-orm";
import { requireAdmin } from "../auth/authorization";

export type AuditEventDomain = 
  | "AUTH"
  | "USERS"
  | "BLOGS"
  | "SITE_SECTION"
  | "SITE_PROFILE"
  | "TEAM"
  | "CONTACT"
  | "SOCIAL"
  | "MEDIA"
  | "UNKNOWN";

export interface AuditEventListItem {
  id: string;
  actionCode: string;
  actionName: string;
  domain: AuditEventDomain;
  domainLabel: string;
  occurredAt: Date;
  actorName: string;
  description: string;
}

const DOMAIN_LABELS: Record<AuditEventDomain, string> = {
  AUTH: "Autenticación",
  USERS: "Usuarios",
  BLOGS: "Blogs",
  SITE_SECTION: "Contenido institucional",
  SITE_PROFILE: "Perfil institucional",
  TEAM: "Equipo",
  CONTACT: "Contacto",
  SOCIAL: "Redes",
  MEDIA: "Multimedia",
  UNKNOWN: "Desconocido",
};

export async function listAuditEvents(params: {
  page: number;
  pageSize?: number;
  action?: string;
  domain?: AuditEventDomain;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}): Promise<{ data: AuditEventListItem[]; total: number }> {
  await requireAdmin();

  const pageSize = params.pageSize || 50;
  const offset = (Math.max(1, params.page) - 1) * pageSize;

  const filters = [];

  if (params.action) {
    filters.push(eq(auditActionTypes.code, params.action));
  }
  if (params.from) {
    const fromDate = new Date(params.from + "T00:00:00.000Z");
    if (!isNaN(fromDate.getTime())) {
      filters.push(gte(auditEvents.occurredAt, fromDate));
    }
  }
  if (params.to) {
    const toDate = new Date(params.to + "T23:59:59.999Z");
    if (!isNaN(toDate.getTime())) {
      filters.push(lte(auditEvents.occurredAt, toDate));
    }
  }

  // To support domain filtering in DB efficiently, we could use EXISTS subqueries, but Drizzle makes it a bit complex.
  // Instead, since we already need to left join to determine the domain for the list, we can filter after fetching, OR left join.
  // Let's do left joins for everything.

  const query = db.select({
    id: auditEvents.id,
    occurredAt: auditEvents.occurredAt,
    actionCode: auditActionTypes.code,
    actionName: auditActionTypes.name,
    actorName: users.displayName,
    authId: auditAuthEvents.auditEventId,
    authUsername: auditAuthEvents.attemptedUsername,
    userId: auditUserEvents.auditEventId,
    blogId: auditBlogEvents.auditEventId,
    blogTitle: blogs.slug,
    sectionId: auditSiteSectionEvents.auditEventId,
    sectionKey: siteSections.sectionKey,
    profileId: auditSiteProfileEvents.auditEventId,
    teamId: auditTeamMemberEvents.auditEventId,
    teamName: teamMembers.id,
    contactId: auditContactMessageEvents.auditEventId,
    socialId: auditSiteSocialLinkEvents.auditEventId,
    mediaId: auditMediaEvents.auditEventId,
    mediaName: mediaAssets.originalFilename,
  })
  .from(auditEvents)
  .innerJoin(auditActionTypes, eq(auditEvents.actionTypeId, auditActionTypes.id))
  .leftJoin(users, eq(auditEvents.actorUserId, users.id))
  .leftJoin(auditAuthEvents, eq(auditEvents.id, auditAuthEvents.auditEventId))
  .leftJoin(auditUserEvents, eq(auditEvents.id, auditUserEvents.auditEventId))
  .leftJoin(auditBlogEvents, eq(auditEvents.id, auditBlogEvents.auditEventId))
  .leftJoin(blogs, eq(auditBlogEvents.blogId, blogs.id))
  .leftJoin(auditSiteSectionEvents, eq(auditEvents.id, auditSiteSectionEvents.auditEventId))
  .leftJoin(siteSections, eq(auditSiteSectionEvents.siteSectionId, siteSections.id))
  .leftJoin(auditSiteProfileEvents, eq(auditEvents.id, auditSiteProfileEvents.auditEventId))
  .leftJoin(auditTeamMemberEvents, eq(auditEvents.id, auditTeamMemberEvents.auditEventId))
  .leftJoin(teamMembers, eq(auditTeamMemberEvents.teamMemberId, teamMembers.id))
  .leftJoin(auditContactMessageEvents, eq(auditEvents.id, auditContactMessageEvents.auditEventId))
  .leftJoin(auditSiteSocialLinkEvents, eq(auditEvents.id, auditSiteSocialLinkEvents.auditEventId))
  .leftJoin(auditMediaEvents, eq(auditEvents.id, auditMediaEvents.auditEventId))
  .leftJoin(mediaAssets, eq(auditMediaEvents.mediaAssetId, mediaAssets.id));

  // If domain filter is provided, add WHERE condition using IS NOT NULL
  if (params.domain) {
    switch (params.domain) {
      case "AUTH": filters.push(sql`${auditAuthEvents.auditEventId} IS NOT NULL`); break;
      case "USERS": filters.push(sql`${auditUserEvents.auditEventId} IS NOT NULL`); break;
      case "BLOGS": filters.push(sql`${auditBlogEvents.auditEventId} IS NOT NULL`); break;
      case "SITE_SECTION": filters.push(sql`${auditSiteSectionEvents.auditEventId} IS NOT NULL`); break;
      case "SITE_PROFILE": filters.push(sql`${auditSiteProfileEvents.auditEventId} IS NOT NULL`); break;
      case "TEAM": filters.push(sql`${auditTeamMemberEvents.auditEventId} IS NOT NULL`); break;
      case "CONTACT": filters.push(sql`${auditContactMessageEvents.auditEventId} IS NOT NULL`); break;
      case "SOCIAL": filters.push(sql`${auditSiteSocialLinkEvents.auditEventId} IS NOT NULL`); break;
      case "MEDIA": filters.push(sql`${auditMediaEvents.auditEventId} IS NOT NULL`); break;
    }
  }

  const whereCondition = filters.length > 0 ? and(...filters) : undefined;
  if (whereCondition) {
    query.where(whereCondition);
  }

  // Obtenemos count
  const countQuery = db.select({ count: sql<number>`count(*)` })
    .from(auditEvents)
    .innerJoin(auditActionTypes, eq(auditEvents.actionTypeId, auditActionTypes.id))
    .leftJoin(auditAuthEvents, eq(auditEvents.id, auditAuthEvents.auditEventId))
    .leftJoin(auditUserEvents, eq(auditEvents.id, auditUserEvents.auditEventId))
    .leftJoin(auditBlogEvents, eq(auditEvents.id, auditBlogEvents.auditEventId))
    .leftJoin(auditSiteSectionEvents, eq(auditEvents.id, auditSiteSectionEvents.auditEventId))
    .leftJoin(auditSiteProfileEvents, eq(auditEvents.id, auditSiteProfileEvents.auditEventId))
    .leftJoin(auditTeamMemberEvents, eq(auditEvents.id, auditTeamMemberEvents.auditEventId))
    .leftJoin(auditContactMessageEvents, eq(auditEvents.id, auditContactMessageEvents.auditEventId))
    .leftJoin(auditSiteSocialLinkEvents, eq(auditEvents.id, auditSiteSocialLinkEvents.auditEventId))
    .leftJoin(auditMediaEvents, eq(auditEvents.id, auditMediaEvents.auditEventId));
    
  if (whereCondition) {
    countQuery.where(whereCondition);
  }
  
  const [countRes] = await countQuery;
  const total = Number(countRes?.count || 0);

  // Apply order & pagination
  const rows = await query
    .orderBy(desc(auditEvents.occurredAt))
    .limit(pageSize)
    .offset(offset);

  const data: AuditEventListItem[] = rows.map((r) => {
    let domain: AuditEventDomain = "UNKNOWN";
    let desc = `Evento genérico: ${r.actionName}`;

    if (r.authId) {
      domain = "AUTH";
      desc = `Intento de acceso: ${r.authUsername || "desconocido"}`;
    } else if (r.userId) {
      domain = "USERS";
      desc = `Acción en usuario (${r.actionCode})`;
    } else if (r.blogId) {
      domain = "BLOGS";
      desc = `Blog afectado: ${r.blogTitle || "Desconocido/Eliminado"}`;
    } else if (r.sectionId) {
      domain = "SITE_SECTION";
      desc = `Sección: ${r.sectionKey || "Desconocido"}`;
    } else if (r.profileId) {
      domain = "SITE_PROFILE";
      desc = `Perfil institucional actualizado`;
    } else if (r.teamId) {
      domain = "TEAM";
      desc = `Miembro: ${r.teamName || "Desconocido"}`;
    } else if (r.contactId) {
      domain = "CONTACT";
      desc = `Cambio en mensaje de contacto`;
    } else if (r.socialId) {
      domain = "SOCIAL";
      desc = `Actualización de redes sociales`;
    } else if (r.mediaId) {
      domain = "MEDIA";
      desc = `Archivo: ${r.mediaName || "Desconocido"}`;
    }

    return {
      id: r.id,
      actionCode: r.actionCode,
      actionName: r.actionName,
      domain,
      domainLabel: DOMAIN_LABELS[domain],
      occurredAt: r.occurredAt,
      actorName: r.actorName || (domain === "AUTH" || domain === "CONTACT" ? "Visitante" : "Sistema"),
      description: desc,
    };
  });

  return { data, total };
}

export async function getAuditEventDetail(id: string) {
  await requireAdmin();

  const [row] = await db.select({
    id: auditEvents.id,
    occurredAt: auditEvents.occurredAt,
    ipAddress: auditEvents.ipAddress,
    userAgent: auditEvents.userAgent,
    actionCode: auditActionTypes.code,
    actionName: auditActionTypes.name,
    actorName: users.displayName,
    actorUsername: users.username,
    actorRole: users.roleId,
    
    // Auth
    authId: auditAuthEvents.auditEventId,
    authUsername: auditAuthEvents.attemptedUsername,
    
    // User
    userId: auditUserEvents.auditEventId,
    targetUserId: auditUserEvents.targetUserId,
    
    // Blog
    blogId: auditBlogEvents.auditEventId,
    targetBlogId: auditBlogEvents.blogId,
    blogTitle: blogs.slug,
    blogPrevVersion: auditBlogEvents.previousVersionId,
    blogNewVersion: auditBlogEvents.newVersionId,
    
    // Site Section
    sectionId: auditSiteSectionEvents.auditEventId,
    sectionKey: siteSections.sectionKey,
    sectionPrev: auditSiteSectionEvents.previousVersionId,
    sectionNew: auditSiteSectionEvents.newVersionId,
    
    // Site Profile
    profileId: auditSiteProfileEvents.auditEventId,
    profilePrev: auditSiteProfileEvents.previousVersionId,
    profileNew: auditSiteProfileEvents.newVersionId,
    
    // Team
    teamId: auditTeamMemberEvents.auditEventId,
    teamName: teamMembers.id,
    teamPrev: auditTeamMemberEvents.previousVersionId,
    teamNew: auditTeamMemberEvents.newVersionId,
    
    // Contact
    contactId: auditContactMessageEvents.auditEventId,
    targetContactId: auditContactMessageEvents.contactMessageId,
    contactPrevStatus: auditContactMessageEvents.previousStatusHistoryId,
    contactNewStatus: auditContactMessageEvents.newStatusHistoryId,
    
    // Social
    socialId: auditSiteSocialLinkEvents.auditEventId,
    
    // Media
    mediaId: auditMediaEvents.auditEventId,
    mediaName: mediaAssets.originalFilename,
    mediaFormat: mediaAssets.format,
  })
  .from(auditEvents)
  .where(eq(auditEvents.id, id))
  .innerJoin(auditActionTypes, eq(auditEvents.actionTypeId, auditActionTypes.id))
  .leftJoin(users, eq(auditEvents.actorUserId, users.id))
  .leftJoin(auditAuthEvents, eq(auditEvents.id, auditAuthEvents.auditEventId))
  .leftJoin(auditUserEvents, eq(auditEvents.id, auditUserEvents.auditEventId))
  .leftJoin(auditBlogEvents, eq(auditEvents.id, auditBlogEvents.auditEventId))
  .leftJoin(blogs, eq(auditBlogEvents.blogId, blogs.id))
  .leftJoin(auditSiteSectionEvents, eq(auditEvents.id, auditSiteSectionEvents.auditEventId))
  .leftJoin(siteSections, eq(auditSiteSectionEvents.siteSectionId, siteSections.id))
  .leftJoin(auditSiteProfileEvents, eq(auditEvents.id, auditSiteProfileEvents.auditEventId))
  .leftJoin(auditTeamMemberEvents, eq(auditEvents.id, auditTeamMemberEvents.auditEventId))
  .leftJoin(teamMembers, eq(auditTeamMemberEvents.teamMemberId, teamMembers.id))
  .leftJoin(auditContactMessageEvents, eq(auditEvents.id, auditContactMessageEvents.auditEventId))
  .leftJoin(auditSiteSocialLinkEvents, eq(auditEvents.id, auditSiteSocialLinkEvents.auditEventId))
  .leftJoin(auditMediaEvents, eq(auditEvents.id, auditMediaEvents.auditEventId))
  .leftJoin(mediaAssets, eq(auditMediaEvents.mediaAssetId, mediaAssets.id));

  if (!row) return null;

  let domain: AuditEventDomain = "UNKNOWN";
  if (row.authId) domain = "AUTH";
  else if (row.userId) domain = "USERS";
  else if (row.blogId) domain = "BLOGS";
  else if (row.sectionId) domain = "SITE_SECTION";
  else if (row.profileId) domain = "SITE_PROFILE";
  else if (row.teamId) domain = "TEAM";
  else if (row.contactId) domain = "CONTACT";
  else if (row.socialId) domain = "SOCIAL";
  else if (row.mediaId) domain = "MEDIA";

  return {
    ...row,
    domain,
    domainLabel: DOMAIN_LABELS[domain],
  };
}
