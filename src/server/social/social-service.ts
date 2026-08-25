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
import { validateSocialUrl } from "./social-url";

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
  // Validate URL (server-side domain invariant)
  const canonicalUrl = data.url ? validateSocialUrl(platformCode, data.url) : "";

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
        url: canonicalUrl,
        displayOrder: data.displayOrder,
        isVisible: data.isVisible,
      }).returning({ id: siteSocialLinks.id });
      
      const newLinkId = insertRes[0].id;

      const actionTypeRes = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "CREATE"));
      const auditRes = await tx.insert(auditEvents).values({
        actionTypeId: actionTypeRes[0].id,
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
        currentLink.url === canonicalUrl &&
        currentLink.displayOrder === data.displayOrder &&
        currentLink.isVisible === data.isVisible
      ) {
        return; // No-op
      }

      await tx.update(siteSocialLinks).set({
        url: canonicalUrl,
        displayOrder: data.displayOrder,
        isVisible: data.isVisible,
        updatedAt: sql`NOW()`,
      }).where(eq(siteSocialLinks.id, currentLink.id));

      const actionTypeRes = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "EDIT"));
      const auditRes = await tx.insert(auditEvents).values({
        actionTypeId: actionTypeRes[0].id,
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
