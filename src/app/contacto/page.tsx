import { getPublicSiteProfile, getPublicSection } from "@/server/site/public-site-service";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicSiteProfile();
  return {
    title: profile?.groupName ? `${profile.groupName} | Contacto` : "DevNova | Contacto",
    description: "Contáctanos y descubre cómo comunicarte con nuestro equipo.",
  };
}

export default async function ContactoPage() {
  const contactSection = await getPublicSection("CONTACT");
  const profile = await getPublicSiteProfile();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#fcfcfa" }}>
      <PublicHeader />
      
      <main style={{ flex: 1, padding: "60px 20px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        
        <h1 style={{ marginBottom: "40px", fontSize: "2.5rem", textAlign: "center" }}>
          {contactSection?.title || "Contacto"}
        </h1>

        <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          {/* Main content */}
          <article style={{ flex: "1 1 400px", fontSize: "1.1rem", lineHeight: "1.8", color: "#333", backgroundColor: "#fff", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
            {contactSection ? (
              <MarkdownRenderer content={contactSection.contentMarkdown} allowMedia={false} />
            ) : (
              <p>La información detallada de contacto estará disponible pronto.</p>
            )}
          </article>

          {/* Sidebar / Quick Contact Info */}
          <aside style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ padding: "30px", backgroundColor: "#1655f8", color: "#fff", borderRadius: "8px" }}>
              <h3 style={{ marginBottom: "20px", fontSize: "1.3rem" }}>Vías de contacto</h3>
              
              {profile?.publicEmail && (
                <div style={{ marginBottom: "15px" }}>
                  <strong>Email:</strong>
                  <br />
                  <a href={`mailto:${profile.publicEmail}`} style={{ color: "#fff", textDecoration: "underline" }}>
                    {profile.publicEmail}
                  </a>
                </div>
              )}
              
              {profile?.publicPhone && (
                <div>
                  <strong>Teléfono:</strong>
                  <br />
                  <a href={`tel:${profile.publicPhone}`} style={{ color: "#fff", textDecoration: "none" }}>
                    {profile.publicPhone}
                  </a>
                </div>
              )}

              {!profile?.publicEmail && !profile?.publicPhone && (
                <p>No se han configurado canales directos.</p>
              )}
            </div>
          </aside>
        </div>

      </main>

      <PublicFooter />
    </div>
  );
}
