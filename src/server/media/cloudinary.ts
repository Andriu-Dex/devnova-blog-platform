import "server-only";
import { v2 as cloudinary } from "cloudinary";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !apiKey || !apiSecret || !uploadPreset) {
    throw new Error("Configuración de Cloudinary incompleta en el servidor.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadPreset,
  };
}

export interface UploadSignaturePayload {
  timestamp: number;
  signature: string;
  cloudName: string;
  apiKey: string;
  uploadPreset: string;
  resourceType: "image";
}

export function generateUploadSignature(): UploadSignaturePayload {
  const config = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign = {
    timestamp,
    upload_preset: config.uploadPreset,
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, config.apiSecret);

  return {
    timestamp,
    signature,
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    uploadPreset: config.uploadPreset,
    resourceType: "image",
  };
}

export function verifyUploadResponseSignature(
  publicId: string,
  version: string | number,
  signature: string
): boolean {
  const config = getCloudinaryConfig();

  // Cloudinary signature calculation: hash of public_id and version sorted alphabetically
  // stringToSign: `public_id=${publicId}&version=${version}`
  const calculatedSignature = cloudinary.utils.api_sign_request(
    {
      public_id: publicId,
      version: String(version),
    },
    config.apiSecret
  );

  return calculatedSignature === signature;
}

export interface CanonicalResourceMetadata {
  assetId: string;
  publicId: string;
  resourceType: string;
  format: string;
  originalFilename: string;
  width: number;
  height: number;
  bytes: number;
}

export async function fetchCanonicalMetadata(
  publicId: string
): Promise<CanonicalResourceMetadata> {
  getCloudinaryConfig(); // ensures config is applied

  const resource = await cloudinary.api.resource(publicId, {
    resource_type: "image",
  });

  if (!resource) {
    throw new Error("No se pudo obtener información del asset en Cloudinary.");
  }

  return {
    assetId: resource.asset_id,
    publicId: resource.public_id,
    resourceType: resource.resource_type,
    format: resource.format,
    originalFilename: resource.original_filename || resource.public_id,
    width: Number(resource.width),
    height: Number(resource.height),
    bytes: Number(resource.bytes),
  };
}

export function getDeliveryUrl(publicId: string, width = 400): string {
  getCloudinaryConfig();

  return cloudinary.url(publicId, {
    width,
    crop: "limit",
    quality: "auto",
    fetch_format: "auto",
    secure: true,
  });
}
