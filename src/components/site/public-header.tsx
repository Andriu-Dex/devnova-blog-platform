import Link from "next/link";
import Image from "next/image";
import { getDeliveryUrl } from "@/server/media/cloudinary";
import { getPublicSiteProfile } from "@/server/site/public-site-service";

export async function PublicHeader() {
  const profile = await getPublicSiteProfile();
  
  const logoUrl = profile?.logoPublicId 
    ? getDeliveryUrl(profile.logoPublicId, 150)
    : null;

  return (
    <header style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      padding: "20px", 
      backgroundColor: "#fff",
      borderBottom: "1px solid #eaeaea" 
    }}>
      <Link href="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}>
        {logoUrl ? (
          <Image 
            src={logoUrl} 
            alt={profile?.logoAltText || profile?.groupName || "DevNova"} 
            width={150} 
            height={50} 
            style={{ objectFit: "contain" }}
          />
        ) : (
          <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            {profile?.groupName || "DevNova"}
          </span>
        )}
      </Link>
      
      <nav style={{ display: "flex", gap: "20px" }}>
        <Link href="/" style={{ textDecoration: "none", color: "#333", fontWeight: "500" }}>Inicio</Link>
        <Link href="/nosotros" style={{ textDecoration: "none", color: "#333", fontWeight: "500" }}>Nosotros</Link>
        <Link href="/blogs" style={{ textDecoration: "none", color: "#333", fontWeight: "500" }}>Blogs</Link>
        <Link href="/contacto" style={{ textDecoration: "none", color: "#333", fontWeight: "500" }}>Contacto</Link>
      </nav>
    </header>
  );
}
