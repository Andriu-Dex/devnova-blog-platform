/**
 * Construye URLs de entrega de Cloudinary usando solo el cloud name público.
 * Seguro para usar en Server Components sin exponer secretos.
 */
export function buildCloudinaryThumbnailUrl(
  publicId: string,
  format: string,
  width = 200,
  crop = "thumb"
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_${crop},w_${width},g_face/v1/${publicId}.${format}`;
}

export function buildCloudinaryFillUrl(
  publicId: string,
  width = 300,
  height = 300
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_${width},h_${height},g_face/v1/${publicId}`;
}
