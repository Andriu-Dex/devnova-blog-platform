"use server";

import { requireAuthorOrAdmin, requireAdmin } from "@/server/auth/authorization";
import {
  registerUploadedMedia,
  softDeleteMedia,
  recoverMedia,
} from "@/server/media/media-service";
import { headers } from "next/headers";
import net from "node:net";
import { revalidatePath } from "next/cache";

async function getMetadata() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  let ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || null;
  if (ipAddress && !net.isIP(ipAddress)) {
    ipAddress = null;
  }
  let userAgent = headersList.get("user-agent") || null;
  if (userAgent && userAgent.length > 1024) {
    userAgent = userAgent.substring(0, 1024);
  }
  return { ipAddress, userAgent };
}

export async function registerUploadedMediaAction(data: {
  publicId: string;
  version: string | number;
  signature: string;
}) {
  const user = await requireAuthorOrAdmin();

  if (!data.publicId || !data.version || !data.signature) {
    return { error: "Datos de subida incompletos." };
  }

  const metadata = await getMetadata();
  const result = await registerUploadedMedia({
    publicId: data.publicId,
    version: data.version,
    signature: data.signature,
    actorUserId: user.id,
    metadata,
  });

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/media");
  
  let mediaItem = undefined;
  if (result.mediaItem) {
    const { getDeliveryUrl } = await import("@/server/media/cloudinary");
    mediaItem = {
      id: result.mediaItem.id,
      publicId: result.mediaItem.publicId,
      format: result.mediaItem.format,
      originalFilename: result.mediaItem.originalFilename,
      width: result.mediaItem.width,
      height: result.mediaItem.height,
      sizeBytes: result.mediaItem.sizeBytes,
      uploaderName: user.displayName || "Tú",
      createdAt: new Date(),
      thumbnailUrl: getDeliveryUrl(result.mediaItem.publicId, 400),
    };
  }

  return { 
    success: true, 
    mediaAssetId: result.mediaAssetId,
    mediaItem,
  };
}

export async function deleteMediaAction(mediaAssetId: string) {
  const user = await requireAdmin();

  if (typeof mediaAssetId !== "string" || !mediaAssetId) {
    return { error: "ID de recurso multimedia inválido." };
  }

  const metadata = await getMetadata();
  const result = await softDeleteMedia(mediaAssetId, user.id, metadata);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/media");
  revalidatePath("/admin/media/trash");
  return { success: true };
}

export async function recoverMediaAction(mediaAssetId: string) {
  const user = await requireAdmin();

  if (typeof mediaAssetId !== "string" || !mediaAssetId) {
    return { error: "ID de recurso multimedia inválido." };
  }

  const metadata = await getMetadata();
  const result = await recoverMedia(mediaAssetId, user.id, metadata);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/media");
  revalidatePath("/admin/media/trash");
  return { success: true };
}
