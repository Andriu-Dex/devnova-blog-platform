import { requireAdmin } from "@/server/auth/authorization";
import { listAdminSocialLinks } from "@/server/social/social-service";
import { SocialRowForm } from "./social-row-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redes Sociales | DevNova",
};

export default async function AdminSocialPage() {
  await requireAdmin();
  
  const links = await listAdminSocialLinks();

  return (
    <main style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>Redes Sociales</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>Configura los enlaces a las redes sociales oficiales. Solo aparecerán en el footer público aquellas que tengan una URL y estén marcadas como visibles.</p>

      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 80px 100px 120px", gap: "15px", padding: "0 15px 10px 15px", fontWeight: "bold", color: "#555", fontSize: "0.9rem" }}>
        <div>Plataforma</div>
        <div>URL Segura (HTTPS)</div>
        <div>Orden</div>
        <div style={{ textAlign: "center" }}>Visible</div>
        <div>Acción</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {links.map(link => (
          <SocialRowForm key={link.platformId} link={link} />
        ))}
      </div>
    </main>
  );
}
