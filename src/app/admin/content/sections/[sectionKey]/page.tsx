import { requireAdmin } from "@/server/auth/authorization";
import { getAdminSectionVersion } from "@/server/site/site-content-service";
import SectionForm from "./section-form";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminSectionPage({ params }: { params: Promise<{ sectionKey: string }> }) {
  await requireAdmin();
  const { sectionKey } = await params;
  
  // validate sectionKey roughly
  const validKeys = ["HOME", "MISSION", "VISION", "ABOUT", "CONTACT"];
  if (!validKeys.includes(sectionKey)) {
    notFound();
  }

  const latestSection = await getAdminSectionVersion(sectionKey);

  return (
    <main style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2rem" }}>Editar Sección: {sectionKey}</h1>
        <Link href={`/admin/content/sections/${sectionKey}/history`} style={{ padding: "8px 16px", backgroundColor: "#f0f4ff", color: "#1655f8", textDecoration: "none", borderRadius: "4px", border: "1px solid #d0deff", fontWeight: "bold" }}>
          Ver Historial
        </Link>
      </div>
      
      <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "8px", border: "1px solid #eaeaea" }}>
        <SectionForm sectionKey={sectionKey} initialData={latestSection} />
      </div>
    </main>
  );
}
