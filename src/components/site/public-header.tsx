import { getDeliveryUrl } from "@/server/media/cloudinary";
import { getPublicSiteProfile } from "@/server/site/public-site-service";
import { PublicHeaderClient } from "./public-header-client";

export async function PublicHeader() {
  const profile = await getPublicSiteProfile();

  // Si hay logo configurado en Cloudinary, usarlo. Si no, usar el logo estático de /public.
  const logoUrl = profile?.logoPublicId
    ? getDeliveryUrl(profile.logoPublicId, 240)
    : "/logo.svg";

  return (
    <PublicHeaderClient
      brandName={profile?.groupName || "DevNova"}
      logoUrl={logoUrl}
      logoAlt={profile?.logoAltText || profile?.groupName || "DevNova"}
    />
  );
}
