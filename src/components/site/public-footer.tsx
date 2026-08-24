import Link from "next/link";
import { getPublicSocialLinks } from "@/server/site/public-site-service";

export async function PublicFooter() {
  const socialLinks = await getPublicSocialLinks();

  return (
    <footer style={{ 
      marginTop: "60px",
      padding: "40px 20px", 
      backgroundColor: "#f9f9f9", 
      borderTop: "1px solid #eaeaea",
      textAlign: "center"
    }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center", gap: "20px" }}>
        <Link href="/" style={{ color: "#666", textDecoration: "none", fontWeight: "bold" }}>Inicio</Link>
        <Link href="/nosotros" style={{ color: "#666", textDecoration: "none", fontWeight: "bold" }}>Nosotros</Link>
        <Link href="/blogs" style={{ color: "#666", textDecoration: "none", fontWeight: "bold" }}>Blogs</Link>
        <Link href="/contacto" style={{ color: "#666", textDecoration: "none", fontWeight: "bold" }}>Contacto</Link>
      </div>
      
      {socialLinks.length > 0 && (
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center", gap: "15px" }}>
          {socialLinks.map(link => {
            // Validación defensiva sencilla
            if (!link.url.startsWith("https://")) return null;
            return (
              <a 
                key={link.platformCode} 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: "#1655f8", 
                  textDecoration: "none", 
                  padding: "5px 10px", 
                  border: "1px solid #1655f8", 
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontFamily: "'IBM Plex Mono', Consolas, monospace"
                }}
              >
                {link.platformName}
              </a>
            );
          })}
        </div>
      )}

      <p style={{ color: "#999", fontSize: "0.9rem", margin: 0 }}>
        &copy; {new Date().getFullYear()} DevNova. Todos los derechos reservados.
      </p>
    </footer>
  );
}
