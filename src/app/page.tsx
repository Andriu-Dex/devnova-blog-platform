import { getPublicSiteProfile, getPublicSection } from "@/server/site/public-site-service";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicSiteProfile();
  return {
    title: profile?.groupName ? `${profile.groupName} | Inicio` : "DevNova | Inicio",
    description: profile?.tagline || "Bienvenido a nuestro sitio institucional",
  };
}

export default async function HomePage() {
  const profile = await getPublicSiteProfile();
  const homeSection = await getPublicSection("HOME");
  const missionSection = await getPublicSection("MISSION");
  const visionSection = await getPublicSection("VISION");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#fcfcfa" }}>
      <PublicHeader />
      
      <main style={{ flex: 1, padding: "40px 20px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        
        {/* HERO SECTION */}
        <section style={{ textAlign: "center", padding: "60px 0", borderBottom: "1px solid #eaeaea" }}>
          <h1 style={{ fontSize: "3rem", marginBottom: "20px", color: "#1a1a1a" }}>
            {profile?.groupName || "DevNova"}
          </h1>
          {profile?.tagline && (
            <p style={{ fontSize: "1.5rem", color: "#666", maxWidth: "600px", margin: "0 auto" }}>
              {profile.tagline}
            </p>
          )}
        </section>

        {/* HOME CONTENT */}
        {homeSection && (
          <article style={{ marginTop: "40px", fontSize: "1.1rem", lineHeight: "1.8", color: "#333" }}>
            {homeSection.title && <h2 style={{ marginBottom: "20px" }}>{homeSection.title}</h2>}
            <MarkdownRenderer content={homeSection.contentMarkdown} allowMedia={false} />
          </article>
        )}

        {/* MISSION & VISION */}
        <div style={{ display: "flex", gap: "40px", marginTop: "60px", flexWrap: "wrap" }}>
          {missionSection && (
            <section style={{ flex: "1 1 300px", padding: "30px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "15px", color: "#1655f8" }}>
                {missionSection.title || "Nuestra Misión"}
              </h3>
              <MarkdownRenderer content={missionSection.contentMarkdown} allowMedia={false} />
            </section>
          )}
          {visionSection && (
            <section style={{ flex: "1 1 300px", padding: "30px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <h3 style={{ fontSize: "1.5rem", marginBottom: "15px", color: "#1655f8" }}>
                {visionSection.title || "Nuestra Visión"}
              </h3>
              <MarkdownRenderer content={visionSection.contentMarkdown} allowMedia={false} />
            </section>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
