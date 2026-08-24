import { db } from "@/server/db";
import {
  siteSocialLinks,
  socialPlatforms,
  auditActionTypes,
  auditEvents,
  auditSiteSocialLinkEvents
} from "@/server/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { getRequestMetadata } from "@/server/utils/request-metadata";

export async function listAdminSocialLinks() {
  const platforms = await db.select().from(socialPlatforms).orderBy(asc(socialPlatforms.name));
  const links = await db.select().from(siteSocialLinks);

  const result = platforms.map(platform => {
    const link = links.find(l => l.socialPlatformId === platform.id);
    return {
      platformId: platform.id,
      platformCode: platform.code,
      platformName: platform.name,
      linkId: link?.id || null,
      url: link?.url || "",
      displayOrder: link?.displayOrder || 0,
      isVisible: link ? link.isVisible : false,
      updatedAt: link?.updatedAt || null,
    };
  });

  return result;
}

export async function upsertSocialLink(
  adminUserId: string,
  platformCode: string,
  data: {
    url: string;
    displayOrder: number;
    isVisible: boolean;
  }
) {
  return await db.transaction(async (tx) => {
    // 1. Lock advisory para site-social-links
    await tx.execute(sql`SELECT pg_advisory_xact_lock(6331902)`);

    // 2. Obtener la plataforma
    const platformRes = await tx.select().from(socialPlatforms).where(eq(socialPlatforms.code, platformCode));
    const platform = platformRes[0];
    if (!platform) throw new Error("Plataforma social inválida.");

    // 3. Consultar link actual
    const linkRes = await tx.select().from(siteSocialLinks).where(eq(siteSocialLinks.socialPlatformId, platform.id));
    const currentLink = linkRes[0];

    const reqMeta = await getRequestMetadata();

    if (!currentLink) {
      // INSERT
      const insertRes = await tx.insert(siteSocialLinks).values({
        socialPlatformId: platform.id,
        url: data.url,
        displayOrder: data.displayOrder,
        isVisible: data.isVisible,
      }).returning({ id: siteSocialLinks.id });
      
      const newLinkId = insertRes[0].id;

      const actionTypeRes = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "CREATE"));
      const auditRes = await tx.insert(auditEvents).values({
        auditActionTypeId: actionTypeRes[0].id,
        actorUserId: adminUserId,
        ipAddress: reqMeta.ipAddress,
        userAgent: reqMeta.userAgent,
      }).returning({ id: auditEvents.id });
      
      await tx.insert(auditSiteSocialLinkEvents).values({
        auditEventId: auditRes[0].id,
        siteSocialLinkId: newLinkId,
      });

    } else {
      // Idempotencia
      if (
        currentLink.url === data.url &&
        currentLink.displayOrder === data.displayOrder &&
        currentLink.isVisible === data.isVisible
      ) {
        return; // No-op
      }

      // UPDATE
      await tx.update(siteSocialLinks).set({
        url: data.url,
        displayOrder: data.displayOrder,
        isVisible: data.isVisible,
        updatedAt: sql`NOW()`,
      }).where(eq(siteSocialLinks.id, currentLink.id));

      const actionTypeRes = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "EDIT"));
      const auditRes = await tx.insert(auditEvents).values({
        auditActionTypeId: actionTypeRes[0].id,
        actorUserId: adminUserId,
        ipAddress: reqMeta.ipAddress,
        userAgent: reqMeta.userAgent,
      }).returning({ id: auditEvents.id });
      
      await tx.insert(auditSiteSocialLinkEvents).values({
        auditEventId: auditRes[0].id,
        siteSocialLinkId: currentLink.id,
      });
    }
  });
}
