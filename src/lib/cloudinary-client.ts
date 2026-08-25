export function getDeliveryUrlClient(publicId: string, width = 400): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.warn("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set");
    return "";
  }

  // Cloudinary standard delivery URL structure:
  // https://res.cloudinary.com/<cloud_name>/<resource_type>/<type>/<transformations>/<version>/<public_id>.<format>
  // Here we use auto format, auto quality, limit width
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_limit,w_${width},q_auto,f_auto/${publicId}`;
}
