import { getPublicSiteProfile, getPublicSection, getPublicTeamMembers } from "@/server/site/public-site-service";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import { Metadata } from "next";
import Image from "next/image";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicSiteProfile();
  return {
    title: profile?.groupName ? `${profile.groupName} | Nosotros` : "DevNova | Nosotros",
    description: "Conoce más sobre nuestra institución, nuestra historia y nuestra visión.",
  };
}

export default async function NosotrosPage() {
  const aboutSection = await getPublicSection("ABOUT");
  const missionSection = await getPublicSection("MISSION");
  const visionSection = await getPublicSection("VISION");
  
  const teamMembers = await getPublicTeamMembers();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#fcfcfa" }}>
      <PublicHeader />
      
      <main style={{ flex: 1, padding: "60px 20px", maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        
        {aboutSection ? (
          <article style={{ fontSize: "1.1rem", lineHeight: "1.8", color: "#333", maxWidth: "800px", margin: "0 auto" }}>
            {aboutSection.title && <h1 style={{ marginBottom: "30px", fontSize: "2.5rem" }}>{aboutSection.title}</h1>}
            <MarkdownRenderer content={aboutSection.contentMarkdown} allowMedia={false} />
          </article>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <h2>Acerca de Nosotros</h2>
            <p>El contenido de esta sección aún no ha sido publicado.</p>
          </div>
        )}

        {/* Separator */}
        <hr style={{ margin: "60px 0", border: "0", borderTop: "1px solid #eaeaea", maxWidth: "800px" }} />

        {/* Complementary Mission/Vision */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px", maxWidth: "800px", margin: "0 auto" }}>
          {missionSection && (
            <section style={{ padding: "20px", backgroundColor: "#fff", borderLeft: "4px solid #1655f8", borderRadius: "0 8px 8px 0" }}>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "15px", color: "#1655f8" }}>
                {missionSection.title || "Misión"}
              </h3>
              <div style={{ fontSize: "1.05rem", lineHeight: "1.7" }}>
                <MarkdownRenderer content={missionSection.contentMarkdown} allowMedia={false} />
              </div>
            </section>
          )}
          {visionSection && (
            <section style={{ padding: "20px", backgroundColor: "#fff", borderLeft: "4px solid #1655f8", borderRadius: "0 8px 8px 0" }}>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "15px", color: "#1655f8" }}>
                {visionSection.title || "Visión"}
              </h3>
              <div style={{ fontSize: "1.05rem", lineHeight: "1.7" }}>
                <MarkdownRenderer content={visionSection.contentMarkdown} allowMedia={false} />
              </div>
            </section>
          )}
        </div>

        {/* Separator */}
        <hr style={{ margin: "60px 0", border: "0", borderTop: "1px solid #eaeaea", maxWidth: "800px", marginLeft: "auto", marginRight: "auto" }} />

        {/* Team Section */}
        {teamMembers.length > 0 && (
          <section style={{ marginTop: "60px" }}>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <h2 style={{ fontSize: "2rem", color: "#121419", marginBottom: "10px" }}>Nuestro Equipo</h2>
              <p style={{ color: "#666", fontSize: "1.1rem" }}>Conoce a los profesionales detrás de DevNova.</p>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "30px" }}>
              {teamMembers.map(member => (
                <div key={member.id} style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #eaeaea", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ height: "200px", backgroundColor: "#f0f4ff", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {member.photoPublicId ? (
                      <Image 
                        src={`https://res.cloudinary.com/db7y9bmbw/image/upload/c_fill,w_400,h_300,g_face/v1/${member.photoPublicId}`}
                        alt={member.photoAltText || member.fullName}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    ) : (
                      <span style={{ fontSize: "4rem", color: "#a8bdfa", fontWeight: "bold" }}>{member.fullName.charAt(0)}</span>
                    )}
                  </div>
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <h3 style={{ margin: "0 0 5px 0", fontSize: "1.3rem", color: "#121419" }}>{member.fullName}</h3>
                    <p style={{ margin: "0 0 15px 0", color: "#1655f8", fontWeight: "bold", fontSize: "0.95rem" }}>{member.roleTitle}</p>
                    <div style={{ flex: 1, fontSize: "0.95rem", lineHeight: "1.6", color: "#555" }}>
                      <MarkdownRenderer content={member.bioMarkdown} allowMedia={false} />
                    </div>
                    
                    <div style={{ display: "flex", gap: "10px", marginTop: "20px", paddingTop: "15px", borderTop: "1px solid #eaeaea" }}>
                      {member.githubUrl && member.githubUrl.startsWith("https://") && (
                        <a href={member.githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#333", textDecoration: "none", fontSize: "0.85rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}>
                          GitHub ↗
                        </a>
                      )}
                      {member.linkedinUrl && member.linkedinUrl.startsWith("https://") && (
                        <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0077b5", textDecoration: "none", fontSize: "0.85rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}>
                          LinkedIn ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      <PublicFooter />
    </div>
  );
}
