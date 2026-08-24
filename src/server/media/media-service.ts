import "server-only";
import { db } from "../db";
import {
  mediaAssets,
  auditMediaEvents,
  auditEvents,
  auditActionTypes,
  users,
} from "../db/schema";
import { eq, desc, isNull, isNotNull, or } from "drizzle-orm";
import { AuthMetadata } from "../auth/types";
import {
  verifyUploadResponseSignature,
  fetchCanonicalMetadata,
  getDeliveryUrl,
} from "./cloudinary";

export interface MediaItem {
  id: string;
  publicId: string;
  format: string;
  originalFilename: string;
  width: number;
  height: number;
  sizeBytes: number;
  uploaderName: string;
  createdAt: Date;
  deletedAt?: Date | null;
  thumbnailUrl: string;
}

export async function registerUploadedMedia({
  publicId,
  version,
  signature,
  actorUserId,
  metadata,
}: {
  publicId: string;
  version: string | number;
  signature: string;
  actorUserId: string;
  metadata: AuthMetadata;
}): Promise<{ success?: boolean; mediaAssetId?: string; error?: string }> {
  // 1. Validar firma de respuesta de Cloudinary
  const isSignatureValid = verifyUploadResponseSignature(publicId, version, signature);
  if (!isSignatureValid) {
    return { error: "Firma de respuesta de Cloudinary inválida o alterada." };
  }

  // 2. Consultar metadatos canónicos directamente de Cloudinary
  let canonical;
  try {
    canonical = await fetchCanonicalMetadata(publicId);
  } catch (err) {
    console.error("Error al consultar metadatos canónicos de Cloudinary:", err);
    return { error: "No fue posible verificar el recurso con Cloudinary." };
  }

  // 3. Validaciones de servidor sobre el asset
  if (canonical.resourceType !== "image") {
    return { error: "Tipo de recurso no permitido. Solo se permiten imágenes." };
  }

  const allowedFormats = ["jpg", "jpeg", "png", "webp"];
  const normalizedFormat = canonical.format.toLowerCase();
  if (!allowedFormats.includes(normalizedFormat)) {
    return { error: "Formato de imagen no permitido. Solo JPG, JPEG, PNG y WebP." };
  }

  const maxBytes = 10 * 1024 * 1024; // 10 MB
  if (canonical.bytes <= 0 || canonical.bytes > maxBytes) {
    return { error: "El tamaño de la imagen debe ser mayor a 0 y no superar los 10 MB." };
  }

  if (canonical.width <= 0 || canonical.height <= 0) {
    return { error: "Las dimensiones de la imagen son inválidas." };
  }

  if (!canonical.assetId || !canonical.publicId) {
    return { error: "Identificadores de Cloudinary inválidos." };
  }

  // 4. Registro en PostgreSQL con manejo de idempotencia y auditoría
  try {
    const mediaAssetId = await db.transaction(async (tx) => {
      // Comprobar si ya existe registrado
      const existing = await tx
        .select()
        .from(mediaAssets)
        .where(
          or(
            eq(mediaAssets.cloudinaryAssetId, canonical.assetId),
            eq(mediaAssets.cloudinaryPublicId, canonical.publicId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        const item = existing[0];
        if (
          item.cloudinaryAssetId === canonical.assetId &&
          item.cloudinaryPublicId === canonical.publicId
        ) {
          // Idempotente: ya está registrado
          return item.id;
        }
        throw new Error("INCONSISTENT_EXISTING_ASSET");
      }

      const createAction = await tx
        .select({ id: auditActionTypes.id })
        .from(auditActionTypes)
        .where(eq(auditActionTypes.code, "CREATE"))
        .limit(1);

      if (!createAction.length) {
        throw new Error("Missing CREATE audit action type");
      }

      const [newMedia] = await tx
        .insert(mediaAssets)
        .values({
          cloudinaryAssetId: canonical.assetId,
          cloudinaryPublicId: canonical.publicId,
          resourceType: canonical.resourceType,
          format: normalizedFormat,
          originalFilename: canonical.originalFilename.substring(0, 255),
          width: canonical.width,
          height: canonical.height,
          sizeBytes: canonical.bytes,
          uploadedByUserId: actorUserId,
          createdAt: new Date(),
          deletedAt: null,
        })
        .returning({ id: mediaAssets.id });

      const [audit] = await tx
        .insert(auditEvents)
        .values({
          actorUserId,
          actionTypeId: createAction[0].id,
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent ?? null,
        })
        .returning({ id: auditEvents.id });

      await tx.insert(auditMediaEvents).values({
        auditEventId: audit.id,
        mediaAssetId: newMedia.id,
      });

      return newMedia.id;
    });

    return { success: true, mediaAssetId };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INCONSISTENT_EXISTING_ASSET") {
      return { error: "Inconsistencia con un asset previamente registrado." };
    }
    console.error("registerUploadedMedia error:", err);
    return { error: "No fue posible registrar el archivo multimedia en la base de datos." };
  }
}

export async function listActiveMedia(): Promise<MediaItem[]> {
  const assets = await db
    .select({
      id: mediaAssets.id,
      publicId: mediaAssets.cloudinaryPublicId,
      format: mediaAssets.format,
      originalFilename: mediaAssets.originalFilename,
      width: mediaAssets.width,
      height: mediaAssets.height,
      sizeBytes: mediaAssets.sizeBytes,
      uploaderName: users.displayName,
      createdAt: mediaAssets.createdAt,
    })
    .from(mediaAssets)
    .innerJoin(users, eq(mediaAssets.uploadedByUserId, users.id))
    .where(isNull(mediaAssets.deletedAt))
    .orderBy(desc(mediaAssets.createdAt));

  return assets.map((a) => ({
    ...a,
    thumbnailUrl: getDeliveryUrl(a.publicId, 400),
  }));
}

export async function softDeleteMedia(
  mediaAssetId: string,
  actorUserId: string,
  metadata: AuthMetadata
): Promise<{ success?: boolean; error?: string }> {
  try {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: mediaAssets.id, deletedAt: mediaAssets.deletedAt })
        .from(mediaAssets)
        .where(eq(mediaAssets.id, mediaAssetId))
        .limit(1);

      if (!existing.length) {
        throw new Error("NOT_FOUND");
      }

      if (existing[0].deletedAt !== null) {
        // Ya está archivado / eliminado lógicamente (idempotente)
        return;
      }

      const deleteAction = await tx
        .select({ id: auditActionTypes.id })
        .from(auditActionTypes)
        .where(eq(auditActionTypes.code, "DELETE"))
        .limit(1);

      if (!deleteAction.length) {
        throw new Error("Missing DELETE audit action type");
      }

      await tx
        .update(mediaAssets)
        .set({ deletedAt: new Date() })
        .where(eq(mediaAssets.id, mediaAssetId));

      const [audit] = await tx
        .insert(auditEvents)
        .values({
          actorUserId,
          actionTypeId: deleteAction[0].id,
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent ?? null,
        })
        .returning({ id: auditEvents.id });

      await tx.insert(auditMediaEvents).values({
        auditEventId: audit.id,
        mediaAssetId,
      });
    });

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return { error: "El archivo multimedia no existe." };
    }
    console.error("softDeleteMedia error:", err);
    return { error: "No fue posible archivar el archivo multimedia." };
  }
}

export async function recoverMedia(
  mediaAssetId: string,
  actorUserId: string,
  metadata: AuthMetadata
): Promise<{ success?: boolean; error?: string }> {
  try {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: mediaAssets.id, deletedAt: mediaAssets.deletedAt })
        .from(mediaAssets)
        .where(eq(mediaAssets.id, mediaAssetId))
        .limit(1);

      if (!existing.length) {
        throw new Error("NOT_FOUND");
      }

      if (existing[0].deletedAt === null) {
        // Ya está activo (idempotente)
        return;
      }

      const recoverAction = await tx
        .select({ id: auditActionTypes.id })
        .from(auditActionTypes)
        .where(eq(auditActionTypes.code, "RECOVER"))
        .limit(1);

      if (!recoverAction.length) {
        throw new Error("Missing RECOVER audit action type");
      }

      await tx
        .update(mediaAssets)
        .set({ deletedAt: null })
        .where(eq(mediaAssets.id, mediaAssetId));

      const [audit] = await tx
        .insert(auditEvents)
        .values({
          actorUserId,
          actionTypeId: recoverAction[0].id,
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent ?? null,
        })
        .returning({ id: auditEvents.id });

      await tx.insert(auditMediaEvents).values({
        auditEventId: audit.id,
        mediaAssetId,
      });
    });

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return { error: "El archivo multimedia no existe." };
    }
    console.error("recoverMedia error:", err);
    return { error: "No fue posible recuperar el archivo multimedia." };
  }
}

export async function listDeletedMedia(): Promise<MediaItem[]> {
  const assets = await db
    .select({
      id: mediaAssets.id,
      publicId: mediaAssets.cloudinaryPublicId,
      format: mediaAssets.format,
      originalFilename: mediaAssets.originalFilename,
      width: mediaAssets.width,
      height: mediaAssets.height,
      sizeBytes: mediaAssets.sizeBytes,
      uploaderName: users.displayName,
      createdAt: mediaAssets.createdAt,
      deletedAt: mediaAssets.deletedAt,
    })
    .from(mediaAssets)
    .innerJoin(users, eq(mediaAssets.uploadedByUserId, users.id))
    .where(isNotNull(mediaAssets.deletedAt))
    .orderBy(desc(mediaAssets.deletedAt));

  return assets.map((a) => ({
    ...a,
    thumbnailUrl: getDeliveryUrl(a.publicId, 400),
  }));
}
