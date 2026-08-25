"use client";

import { registerUploadedMediaAction } from "@/app/dashboard/media/actions";

export async function uploadFileDirectly(file: File) {
  // 1. Obtener firma del backend
  const signRes = await fetch("/api/cloudinary/sign-upload", {
    method: "POST",
  });

  if (!signRes.ok) {
    const errData = await signRes.json().catch(() => ({}));
    throw new Error(errData.error || "No fue posible obtener la firma de subida.");
  }

  const { timestamp, signature, cloudName, apiKey, uploadPreset } = await signRes.json();

  // 2. Subida directa del navegador a Cloudinary
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  if (uploadPreset) {
    formData.append("upload_preset", uploadPreset);
  }

  const cloudRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!cloudRes.ok) {
    const cloudErr = await cloudRes.json().catch(() => ({}));
    throw new Error(cloudErr.error?.message || "Error al subir la imagen a Cloudinary.");
  }

  const cloudData = await cloudRes.json();

  // 3. Registro verificado en el backend
  const registerRes = await registerUploadedMediaAction({
    publicId: cloudData.public_id,
    version: cloudData.version,
    signature: cloudData.signature,
  });

  if (registerRes.error) {
    throw new Error(registerRes.error);
  }

  return { mediaAssetId: registerRes.mediaAssetId! };
}
