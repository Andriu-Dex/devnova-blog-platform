import { getDeliveryUrl } from "@/server/media/cloudinary";
import { getPublicSiteProfile } from "@/server/site/public-site-service";
import { PublicHeaderClient } from "./public-header-client";

export async function PublicHeader() {
  const profile = await getPublicSiteProfile();

  const logoUrl = profile?.logoPublicId
    ? getDeliveryUrl(profile.logoPublicId, 240)
    : null;

  return (
    <PublicHeaderClient
      brandName={profile?.groupName || "DevNova"}
      logoUrl={logoUrl}
      logoAlt={profile?.logoAltText || profile?.groupName || "DevNova"}
    />
  );
}
