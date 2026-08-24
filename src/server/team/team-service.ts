import { db } from "@/server/db";
import {
  teamMembers,
  teamMemberVersions,
  auditActionTypes,
  auditEvents,
  auditTeamMemberEvents,
  mediaAssets
} from "@/server/db/schema";
import { eq, desc, sql, isNull, isNotNull, and } from "drizzle-orm";
import { getRequestMetadata } from "@/server/utils/request-metadata";

export async function listAdminTeamMembers(includeDeleted = false) {
  // Utilizamos una subquery para obtener la versión latest por member
  const latestSubquery = db
    .select({
      teamMemberId: teamMemberVersions.teamMemberId,
      maxVersion: sql<number>`MAX(${teamMemberVersions.versionNumber})`.as("max_version")
    })
    .from(teamMemberVersions)
    .groupBy(teamMemberVersions.teamMemberId)
    .as("latest_versions");

  const query = db
    .select({
      id: teamMembers.id,
      deletedAt: teamMembers.deletedAt,
      versionId: teamMemberVersions.id,
      versionNumber: teamMemberVersions.versionNumber,
      fullName: teamMemberVersions.fullName,
      roleTitle: teamMemberVersions.roleTitle,
      isVisible: teamMemberVersions.isVisible,
      displayOrder: teamMemberVersions.displayOrder,
      photoMediaAssetId: teamMemberVersions.photoMediaAssetId,
      photoAltText: teamMemberVersions.photoAltText,
      updatedAt: teamMemberVersions.createdAt,
    })
    .from(teamMembers)
    .innerJoin(latestSubquery, eq(teamMembers.id, latestSubquery.teamMemberId))
    .innerJoin(
      teamMemberVersions,
      and(
        eq(teamMemberVersions.teamMemberId, latestSubquery.teamMemberId),
        eq(teamMemberVersions.versionNumber, latestSubquery.maxVersion)
      )
    );

  if (includeDeleted) {
    query.where(isNotNull(teamMembers.deletedAt));
  } else {
    query.where(isNull(teamMembers.deletedAt));
  }

  const rows = await query.orderBy(desc(teamMemberVersions.displayOrder), desc(teamMembers.createdAt));
  return rows;
}

export async function getTeamMemberHistory(memberId: string) {
  const rows = await db
    .select({
      id: teamMemberVersions.id,
      versionNumber: teamMemberVersions.versionNumber,
      fullName: teamMemberVersions.fullName,
      roleTitle: teamMemberVersions.roleTitle,
      isVisible: teamMemberVersions.isVisible,
      displayOrder: teamMemberVersions.displayOrder,
      editedByUserId: teamMemberVersions.editedByUserId,
      changeSummary: teamMemberVersions.changeSummary,
      createdAt: teamMemberVersions.createdAt,
      restoredFromVersionId: teamMemberVersions.restoredFromVersionId,
      photoMediaAssetId: teamMemberVersions.photoMediaAssetId,
    })
    .from(teamMemberVersions)
    .where(eq(teamMemberVersions.teamMemberId, memberId))
    .orderBy(desc(teamMemberVersions.versionNumber));

  return rows;
}

export async function getTeamMemberEditData(memberId: string) {
  const rows = await db
    .select({
      id: teamMemberVersions.id,
      versionNumber: teamMemberVersions.versionNumber,
      fullName: teamMemberVersions.fullName,
      roleTitle: teamMemberVersions.roleTitle,
      bioMarkdown: teamMemberVersions.bioMarkdown,
      photoMediaAssetId: teamMemberVersions.photoMediaAssetId,
      photoAltText: teamMemberVersions.photoAltText,
      githubUrl: teamMemberVersions.githubUrl,
      linkedinUrl: teamMemberVersions.linkedinUrl,
      displayOrder: teamMemberVersions.displayOrder,
      isVisible: teamMemberVersions.isVisible,
    })
    .from(teamMemberVersions)
    .where(eq(teamMemberVersions.teamMemberId, memberId))
    .orderBy(desc(teamMemberVersions.versionNumber))
    .limit(1);
    
  if (rows.length === 0) return null;
  const version = rows[0];

  let mediaArchived = false;
  if (version.photoMediaAssetId) {
    const asset = await db.select({ deletedAt: mediaAssets.deletedAt }).from(mediaAssets).where(eq(mediaAssets.id, version.photoMediaAssetId));
    if (asset[0] && asset[0].deletedAt !== null) {
      mediaArchived = true;
    }
  }

  return { ...version, mediaArchived };
}

export async function createTeamMember(
  adminUserId: string,
  data: {
    fullName: string;
    roleTitle: string;
    bioMarkdown: string;
    photoMediaAssetId: string | null;
    photoAltText: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    displayOrder: number;
    isVisible: boolean;
  }
) {
  if (data.bioMarkdown.includes("media://")) {
    throw new Error("Las imágenes dentro de la biografía todavía no están habilitadas.");
  }

  return await db.transaction(async (tx) => {
    // 1. Validar y lock media
    if (data.photoMediaAssetId) {
      const assetRows = await tx
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, data.photoMediaAssetId))
        .for("share");
        
      const asset = assetRows[0];
      if (!asset || asset.deletedAt !== null) {
        throw new Error("El medio seleccionado no existe o fue archivado.");
      }
    }

    // 2. Crear root
    const rootRes = await tx.insert(teamMembers).values({}).returning({ id: teamMembers.id });
    const newMemberId = rootRes[0].id;

    // 3. Crear versión 1
    const versionRes = await tx.insert(teamMemberVersions).values({
      teamMemberId: newMemberId,
      versionNumber: 1,
      fullName: data.fullName,
      roleTitle: data.roleTitle,
      bioMarkdown: data.bioMarkdown,
      photoMediaAssetId: data.photoMediaAssetId,
      photoAltText: data.photoAltText,
      githubUrl: data.githubUrl,
      linkedinUrl: data.linkedinUrl,
      displayOrder: data.displayOrder,
      isVisible: data.isVisible,
      editedByUserId: adminUserId,
      changeSummary: "Versión inicial",
    }).returning({ id: teamMemberVersions.id });
    const newVersionId = versionRes[0].id;

    // 4. Auditoría
    const reqMeta = await getRequestMetadata();
    const actionTypeRes = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "CREATE"));
    const auditRes = await tx.insert(auditEvents).values({
      auditActionTypeId: actionTypeRes[0].id,
      actorUserId: adminUserId,
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    }).returning({ id: auditEvents.id });
    
    await tx.insert(auditTeamMemberEvents).values({
      auditEventId: auditRes[0].id,
      teamMemberId: newMemberId,
      previousVersionId: null,
      newVersionId: newVersionId,
    });

    return newMemberId;
  });
}

export async function updateTeamMember(
  adminUserId: string,
  memberId: string,
  data: {
    baseVersionId: string;
    fullName: string;
    roleTitle: string;
    bioMarkdown: string;
    photoMediaAssetId: string | null;
    photoAltText: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    displayOrder: number;
    isVisible: boolean;
    changeSummary: string;
  }
) {
  if (data.bioMarkdown.includes("media://")) {
    throw new Error("Las imágenes dentro de la biografía todavía no están habilitadas.");
  }

  return await db.transaction(async (tx) => {
    // 1. Lock root
    const memberRows = await tx
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, memberId))
      .for("update");
      
    if (!memberRows[0] || memberRows[0].deletedAt !== null) {
      throw new Error("El integrante no existe o fue eliminado.");
    }

    // 2. Obtener latest version
    const latestRows = await tx
      .select()
      .from(teamMemberVersions)
      .where(eq(teamMemberVersions.teamMemberId, memberId))
      .orderBy(desc(teamMemberVersions.versionNumber))
      .limit(1);
      
    const latest = latestRows[0];
    if (!latest) throw new Error("No hay versión previa.");
    
    if (latest.id !== data.baseVersionId) {
      throw new Error("Este integrante fue modificado mientras lo editabas. Recarga la página antes de guardar.");
    }

    // 3. Validar y lock media (No permitir re-guardar medio archivado en EDIT)
    if (data.photoMediaAssetId) {
      const assetRows = await tx
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, data.photoMediaAssetId))
        .for("share");
        
      const asset = assetRows[0];
      if (!asset || asset.deletedAt !== null) {
        throw new Error("El medio seleccionado no existe o fue archivado. Seleccione o quite la foto.");
      }
    }

    // 4. Crear nueva versión
    const versionRes = await tx.insert(teamMemberVersions).values({
      teamMemberId: memberId,
      versionNumber: latest.versionNumber + 1,
      fullName: data.fullName,
      roleTitle: data.roleTitle,
      bioMarkdown: data.bioMarkdown,
      photoMediaAssetId: data.photoMediaAssetId,
      photoAltText: data.photoAltText,
      githubUrl: data.githubUrl,
      linkedinUrl: data.linkedinUrl,
      displayOrder: data.displayOrder,
      isVisible: data.isVisible,
      editedByUserId: adminUserId,
      changeSummary: data.changeSummary,
    }).returning({ id: teamMemberVersions.id });
    const newVersionId = versionRes[0].id;

    // 5. Auditoría
    const reqMeta = await getRequestMetadata();
    const actionTypeRes = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "EDIT"));
    const auditRes = await tx.insert(auditEvents).values({
      auditActionTypeId: actionTypeRes[0].id,
      actorUserId: adminUserId,
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    }).returning({ id: auditEvents.id });
    
    await tx.insert(auditTeamMemberEvents).values({
      auditEventId: auditRes[0].id,
      teamMemberId: memberId,
      previousVersionId: latest.id,
      newVersionId: newVersionId,
    });
  });
}

export async function restoreTeamMemberVersion(
  adminUserId: string,
  memberId: string,
  sourceVersionId: string,
  changeSummary: string
) {
  return await db.transaction(async (tx) => {
    // 1. Lock root
    const memberRows = await tx
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, memberId))
      .for("update");
      
    if (!memberRows[0] || memberRows[0].deletedAt !== null) {
      throw new Error("El integrante no existe o fue eliminado.");
    }

    // 2. Validar fuente
    const sourceRows = await tx.select().from(teamMemberVersions).where(eq(teamMemberVersions.id, sourceVersionId));
    const source = sourceRows[0];
    if (!source || source.teamMemberId !== memberId) throw new Error("Versión fuente inválida.");
    
    if (source.bioMarkdown && source.bioMarkdown.includes("media://")) {
      throw new Error("Las imágenes dentro de la biografía todavía no están habilitadas.");
    }

    // 3. Obtener latest version
    const latestRows = await tx
      .select()
      .from(teamMemberVersions)
      .where(eq(teamMemberVersions.teamMemberId, memberId))
      .orderBy(desc(teamMemberVersions.versionNumber))
      .limit(1);
      
    const latest = latestRows[0];
    if (!latest) throw new Error("No hay versión previa.");
    
    if (source.id === latest.id) {
      throw new Error("La versión a restaurar ya es la actual.");
    }

    // 4. Crear nueva versión copiando (sin requerir media activo)
    const versionRes = await tx.insert(teamMemberVersions).values({
      teamMemberId: memberId,
      versionNumber: latest.versionNumber + 1,
      fullName: source.fullName,
      roleTitle: source.roleTitle,
      bioMarkdown: source.bioMarkdown,
      photoMediaAssetId: source.photoMediaAssetId,
      photoAltText: source.photoAltText,
      githubUrl: source.githubUrl,
      linkedinUrl: source.linkedinUrl,
      displayOrder: source.displayOrder,
      isVisible: source.isVisible,
      editedByUserId: adminUserId,
      changeSummary: changeSummary,
      restoredFromVersionId: source.id
    }).returning({ id: teamMemberVersions.id });
    const newVersionId = versionRes[0].id;

    // 5. Auditoría
    const reqMeta = await getRequestMetadata();
    const actionTypeRes = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "RESTORE"));
    const auditRes = await tx.insert(auditEvents).values({
      auditActionTypeId: actionTypeRes[0].id,
      actorUserId: adminUserId,
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    }).returning({ id: auditEvents.id });
    
    await tx.insert(auditTeamMemberEvents).values({
      auditEventId: auditRes[0].id,
      teamMemberId: memberId,
      previousVersionId: latest.id,
      newVersionId: newVersionId,
    });
  });
}

export async function softDeleteTeamMember(adminUserId: string, memberId: string) {
  return await db.transaction(async (tx) => {
    const rows = await tx.select().from(teamMembers).where(eq(teamMembers.id, memberId)).for("update");
    if (!rows[0]) throw new Error("Integrante no encontrado.");
    if (rows[0].deletedAt !== null) return; // idempotente

    await tx.update(teamMembers).set({ deletedAt: sql`NOW()` }).where(eq(teamMembers.id, memberId));

    const reqMeta = await getRequestMetadata();
    const actionTypeRes = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "DELETE"));
    const auditRes = await tx.insert(auditEvents).values({
      auditActionTypeId: actionTypeRes[0].id,
      actorUserId: adminUserId,
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    }).returning({ id: auditEvents.id });
    
    await tx.insert(auditTeamMemberEvents).values({
      auditEventId: auditRes[0].id,
      teamMemberId: memberId,
      previousVersionId: null,
      newVersionId: null,
    });
  });
}

export async function recoverTeamMember(adminUserId: string, memberId: string) {
  return await db.transaction(async (tx) => {
    const rows = await tx.select().from(teamMembers).where(eq(teamMembers.id, memberId)).for("update");
    if (!rows[0]) throw new Error("Integrante no encontrado.");
    if (rows[0].deletedAt === null) return; // idempotente

    await tx.update(teamMembers).set({ deletedAt: null }).where(eq(teamMembers.id, memberId));

    const reqMeta = await getRequestMetadata();
    const actionTypeRes = await tx.select({ id: auditActionTypes.id }).from(auditActionTypes).where(eq(auditActionTypes.code, "RECOVER"));
    const auditRes = await tx.insert(auditEvents).values({
      auditActionTypeId: actionTypeRes[0].id,
      actorUserId: adminUserId,
      ipAddress: reqMeta.ipAddress,
      userAgent: reqMeta.userAgent,
    }).returning({ id: auditEvents.id });
    
    await tx.insert(auditTeamMemberEvents).values({
      auditEventId: auditRes[0].id,
      teamMemberId: memberId,
      previousVersionId: null,
      newVersionId: null,
    });
  });
}
