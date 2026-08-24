import { db } from "@/server/db";
import {
  siteProfileVersions,
  siteSections,
  siteSectionVersions,
  auditEvents,
  auditSiteProfileEvents,
  auditSiteSectionEvents,
  auditActionTypes,
  mediaAssets
} from "@/server/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getRequestMetadata } from "@/server/utils/request-metadata";

export async function getAdminProfileHistory() {
  return await db
    .select({
      id: siteProfileVersions.id,
      versionNumber: siteProfileVersions.versionNumber,
      groupName: siteProfileVersions.groupName,
      tagline: siteProfileVersions.tagline,
      editedByUserId: siteProfileVersions.editedByUserId,
      changeSummary: siteProfileVersions.changeSummary,
      createdAt: siteProfileVersions.createdAt,
      restoredFromVersionId: siteProfileVersions.restoredFromVersionId,
      hasLogo: sql<boolean>`${siteProfileVersions.logoMediaAssetId} IS NOT NULL`,
    })
    .from(siteProfileVersions)
    .orderBy(desc(siteProfileVersions.versionNumber));
}

export async function getAdminProfileVersion(versionId?: string) {
  if (versionId) {
    const rows = await db
      .select()
      .from(siteProfileVersions)
      .where(eq(siteProfileVersions.id, versionId));
    return rows[0] || null;
  }
  const rows = await db
    .select()
    .from(siteProfileVersions)
    .orderBy(desc(siteProfileVersions.versionNumber))
    .limit(1);
  return rows[0] || null;
}

export async function updateSiteProfile(
  adminUserId: string,
  data: {
    groupName: string;
    tagline?: string | null;
    logoMediaAssetId?: string | null;
    logoAltText?: string | null;
    publicEmail?: string | null;
    publicPhone?: string | null;
    changeSummary: string;
    baseVersionId?: string | null;
  }
) {
  const reqMeta = await getRequestMetadata();

  return await db.transaction(async (tx) => {
    // 1. Advisory Lock to serialize Profile edits
    // 6331901 is an arbitrary integer derived from hash of "devnova:site-profile"
    await tx.execute(sql`SELECT pg_advisory_xact_lock(6331901)`);

    // 2. Fetch Latest Version
    const latestRows = await tx
      .select()
      .from(siteProfileVersions)
      .orderBy(desc(siteProfileVersions.versionNumber))
      .limit(1);
    
    const latest = latestRows[0] || null;

    // 3. Concurrency check
    if (latest) {
      if (latest.id !== data.baseVersionId) {
        throw new Error(
          "El perfil institucional fue modificado mientras lo editabas. Recarga la página antes de guardar."
        );
      }
    } else {
      if (data.baseVersionId) {
        throw new Error("Estado base inconsistente. Recarga la página.");
      }
    }

    // 4. Validate logo media if present (must be active for new edits unless it's a restore, but restore uses a separate function)
    if (data.logoMediaAssetId) {
      // Lock media row
      const asset = await tx
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, data.logoMediaAssetId))
        .for("share");
      
      if (!asset[0] || asset[0].deletedAt !== null) {
        throw new Error("El logo seleccionado fue archivado o no existe.");
      }

      if (!data.logoAltText || data.logoAltText.trim() === "" || data.logoAltText.trim().length > 255) {
        throw new Error("logoAltText es obligatorio, no vacío, y no puede superar los 255 caracteres cuando hay un logo seleccionado.");
      }
    } else {
      data.logoMediaAssetId = null;
      data.logoAltText = null;
    }

    // 5. Audit Type
    const isInitial = !latest;
    const actionCode = isInitial ? "CREATE" : "EDIT";
    
    const actionTypeRes = await tx
      .select({ id: auditActionTypes.id })
      .from(auditActionTypes)
      .where(eq(auditActionTypes.code, actionCode));
      
    if (!actionTypeRes[0]) throw new Error(`Action type ${actionCode} not found`);

    const nextVersionNumber = latest ? latest.versionNumber + 1 : 1;
    const summary = isInitial ? "Versión inicial" : data.changeSummary;

    // 6. Insert new Profile Version
    const newVersionRes = await tx
      .insert(siteProfileVersions)
      .values({
        versionNumber: nextVersionNumber,
        groupName: data.groupName.trim(),
        tagline: data.tagline?.trim() || null,
        logoMediaAssetId: data.logoMediaAssetId || null,
        logoAltText: data.logoAltText?.trim() || null,
        publicEmail: data.publicEmail?.trim() || null,
        publicPhone: data.publicPhone?.trim() || null,
        editedByUserId: adminUserId,
        changeSummary: summary,
      })
      .returning({ id: siteProfileVersions.id });
    
    const newVersionId = newVersionRes[0].id;

    // 7. Audit Logging
    const auditRes = await tx
      .insert(auditEvents)
      .values({
        actorUserId: adminUserId,
        actionTypeId: actionTypeRes[0].id,
        ipAddress: reqMeta.ipAddress || null,
        userAgent: reqMeta.userAgent || null,
      })
      .returning({ id: auditEvents.id });
      
    await tx.insert(auditSiteProfileEvents).values({
      auditEventId: auditRes[0].id,
      previousVersionId: latest ? latest.id : null,
      newVersionId,
    });

    return newVersionId;
  });
}

export async function restoreProfileVersion(
  adminUserId: string,
  sourceVersionId: string,
  motivo: string
) {
  const reqMeta = await getRequestMetadata();

  return await db.transaction(async (tx) => {
    // 1. Lock
    await tx.execute(sql`SELECT pg_advisory_xact_lock(6331901)`);

    // 2. Validate source
    const sourceRows = await tx
      .select()
      .from(siteProfileVersions)
      .where(eq(siteProfileVersions.id, sourceVersionId));
    
    const source = sourceRows[0];
    if (!source) throw new Error("Versión fuente no existe.");

    // 3. Get latest
    const latestRows = await tx
      .select()
      .from(siteProfileVersions)
      .orderBy(desc(siteProfileVersions.versionNumber))
      .limit(1);
      
    const latest = latestRows[0];
    if (!latest) throw new Error("No hay perfil vigente para restaurar.");
    if (source.id === latest.id) throw new Error("La versión fuente es idéntica a la última versión activa.");

    // 4. Audit Type
    const actionTypeRes = await tx
      .select({ id: auditActionTypes.id })
      .from(auditActionTypes)
      .where(eq(auditActionTypes.code, "RESTORE"));
      
    if (!actionTypeRes[0]) throw new Error(`Action type RESTORE not found`);

    // 5. Insert new Profile Version copying source (no need to validate logo active state for restores!)
    const nextVersionNumber = latest.versionNumber + 1;
    const newVersionRes = await tx
      .insert(siteProfileVersions)
      .values({
        versionNumber: nextVersionNumber,
        groupName: source.groupName,
        tagline: source.tagline,
        logoMediaAssetId: source.logoMediaAssetId,
        logoAltText: source.logoAltText,
        publicEmail: source.publicEmail,
        publicPhone: source.publicPhone,
        editedByUserId: adminUserId,
        changeSummary: motivo,
        restoredFromVersionId: source.id,
      })
      .returning({ id: siteProfileVersions.id });
      
    const newVersionId = newVersionRes[0].id;

    // 6. Audit Logging
    const auditRes = await tx
      .insert(auditEvents)
      .values({
        actorUserId: adminUserId,
        actionTypeId: actionTypeRes[0].id,
        ipAddress: reqMeta.ipAddress || null,
        userAgent: reqMeta.userAgent || null,
      })
      .returning({ id: auditEvents.id });
      
    await tx.insert(auditSiteProfileEvents).values({
      auditEventId: auditRes[0].id,
      previousVersionId: latest.id,
      newVersionId,
    });

    return newVersionId;
  });
}

// ---------------------------------------------------------
// Site Sections
// ---------------------------------------------------------

export async function getAdminSectionHistory(sectionKey: string) {
  const sec = await db.select().from(siteSections).where(eq(siteSections.sectionKey, sectionKey));
  if (!sec[0]) return [];

  return await db
    .select({
      id: siteSectionVersions.id,
      versionNumber: siteSectionVersions.versionNumber,
      title: siteSectionVersions.title,
      editedByUserId: siteSectionVersions.editedByUserId,
      changeSummary: siteSectionVersions.changeSummary,
      createdAt: siteSectionVersions.createdAt,
      restoredFromVersionId: siteSectionVersions.restoredFromVersionId,
    })
    .from(siteSectionVersions)
    .where(eq(siteSectionVersions.siteSectionId, sec[0].id))
    .orderBy(desc(siteSectionVersions.versionNumber));
}

export async function getAdminSectionVersion(sectionKey: string, versionId?: string) {
  const sec = await db.select().from(siteSections).where(eq(siteSections.sectionKey, sectionKey));
  if (!sec[0]) return null;

  if (versionId) {
    const rows = await db
      .select()
      .from(siteSectionVersions)
      .where(eq(siteSectionVersions.id, versionId));
    return rows[0] || null;
  }
  
  const rows = await db
    .select()
    .from(siteSectionVersions)
    .where(eq(siteSectionVersions.siteSectionId, sec[0].id))
    .orderBy(desc(siteSectionVersions.versionNumber))
    .limit(1);
    
  return rows[0] || null;
}

export async function updateSiteSection(
  adminUserId: string,
  sectionKey: string,
  data: {
    title?: string | null;
    contentMarkdown: string;
    changeSummary: string;
    baseVersionId?: string | null;
  }
) {
  if (data.contentMarkdown.includes("media://")) {
    throw new Error("Las imágenes dentro del contenido institucional todavía no están habilitadas.");
  }

  const reqMeta = await getRequestMetadata();

  return await db.transaction(async (tx) => {
    // 1. Lock site_sections row
    const secRows = await tx
      .select()
      .from(siteSections)
      .where(eq(siteSections.sectionKey, sectionKey))
      .for("update");
      
    const sectionRow = secRows[0];
    if (!sectionRow) throw new Error("Site section no existe.");

    // 2. Fetch Latest Version
    const latestRows = await tx
      .select()
      .from(siteSectionVersions)
      .where(eq(siteSectionVersions.siteSectionId, sectionRow.id))
      .orderBy(desc(siteSectionVersions.versionNumber))
      .limit(1);
    
    const latest = latestRows[0] || null;

    // 3. Concurrency check
    if (latest) {
      if (latest.id !== data.baseVersionId) {
        throw new Error(
          "Esta sección fue modificada mientras la editabas. Recarga la página antes de guardar."
        );
      }
    } else {
      if (data.baseVersionId) {
        throw new Error("Estado base inconsistente. Recarga la página.");
      }
    }

    // 4. Audit Type
    const isInitial = !latest;
    const actionCode = isInitial ? "CREATE" : "EDIT";
    
    const actionTypeRes = await tx
      .select({ id: auditActionTypes.id })
      .from(auditActionTypes)
      .where(eq(auditActionTypes.code, actionCode));
      
    if (!actionTypeRes[0]) throw new Error(`Action type ${actionCode} not found`);

    const nextVersionNumber = latest ? latest.versionNumber + 1 : 1;
    const summary = isInitial ? "Versión inicial" : data.changeSummary;

    // 5. Insert new Section Version
    const newVersionRes = await tx
      .insert(siteSectionVersions)
      .values({
        siteSectionId: sectionRow.id,
        versionNumber: nextVersionNumber,
        title: data.title?.trim() || null,
        contentMarkdown: data.contentMarkdown,
        editedByUserId: adminUserId,
        changeSummary: summary,
      })
      .returning({ id: siteSectionVersions.id });
    
    const newVersionId = newVersionRes[0].id;

    // 6. Audit Logging
    const auditRes = await tx
      .insert(auditEvents)
      .values({
        actorUserId: adminUserId,
        actionTypeId: actionTypeRes[0].id,
        ipAddress: reqMeta.ipAddress || null,
        userAgent: reqMeta.userAgent || null,
      })
      .returning({ id: auditEvents.id });
      
    await tx.insert(auditSiteSectionEvents).values({
      auditEventId: auditRes[0].id,
      siteSectionId: sectionRow.id,
      previousVersionId: latest ? latest.id : null,
      newVersionId,
    });

    return newVersionId;
  });
}

export async function restoreSectionVersion(
  adminUserId: string,
  sectionKey: string,
  sourceVersionId: string,
  motivo: string
) {
  const reqMeta = await getRequestMetadata();

  return await db.transaction(async (tx) => {
    // 1. Lock site_sections row
    const secRows = await tx
      .select()
      .from(siteSections)
      .where(eq(siteSections.sectionKey, sectionKey))
      .for("update");
      
    const sectionRow = secRows[0];
    if (!sectionRow) throw new Error("Site section no existe.");

    // 2. Validate source
    const sourceRows = await tx
      .select()
      .from(siteSectionVersions)
      .where(eq(siteSectionVersions.id, sourceVersionId));
    
    const source = sourceRows[0];
    if (!source) throw new Error("Versión fuente no existe.");
    if (source.siteSectionId !== sectionRow.id) throw new Error("La versión fuente no pertenece a esta sección.");

    if (source.contentMarkdown.includes("media://")) {
      throw new Error("Las imágenes dentro del contenido institucional todavía no están habilitadas.");
    }

    // 3. Get latest
    const latestRows = await tx
      .select()
      .from(siteSectionVersions)
      .where(eq(siteSectionVersions.siteSectionId, sectionRow.id))
      .orderBy(desc(siteSectionVersions.versionNumber))
      .limit(1);
      
    const latest = latestRows[0];
    if (!latest) throw new Error("No hay sección vigente para restaurar.");
    if (source.id === latest.id) throw new Error("La versión fuente es idéntica a la última versión activa.");

    // 4. Audit Type
    const actionTypeRes = await tx
      .select({ id: auditActionTypes.id })
      .from(auditActionTypes)
      .where(eq(auditActionTypes.code, "RESTORE"));
      
    if (!actionTypeRes[0]) throw new Error(`Action type RESTORE not found`);

    // 5. Insert new Version
    const nextVersionNumber = latest.versionNumber + 1;
    const newVersionRes = await tx
      .insert(siteSectionVersions)
      .values({
        siteSectionId: sectionRow.id,
        versionNumber: nextVersionNumber,
        title: source.title,
        contentMarkdown: source.contentMarkdown,
        editedByUserId: adminUserId,
        changeSummary: motivo,
        restoredFromVersionId: source.id,
      })
      .returning({ id: siteSectionVersions.id });
      
    const newVersionId = newVersionRes[0].id;

    // 6. Audit Logging
    const auditRes = await tx
      .insert(auditEvents)
      .values({
        actorUserId: adminUserId,
        actionTypeId: actionTypeRes[0].id,
        ipAddress: reqMeta.ipAddress || null,
        userAgent: reqMeta.userAgent || null,
      })
      .returning({ id: auditEvents.id });
      
    await tx.insert(auditSiteSectionEvents).values({
      auditEventId: auditRes[0].id,
      siteSectionId: sectionRow.id,
      previousVersionId: latest.id,
      newVersionId,
    });

    return newVersionId;
  });
}
