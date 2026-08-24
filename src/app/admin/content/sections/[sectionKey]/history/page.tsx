import { requireAdmin } from "@/server/auth/authorization";
import { getAdminSectionHistory } from "@/server/site/site-content-service";
import RestoreSectionForm from "./restore-form";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SectionHistoryPage({ params }: { params: Promise<{ sectionKey: string }> }) {
  await requireAdmin();
  const { sectionKey } = await params;
  
  const validKeys = ["HOME", "MISSION", "VISION", "ABOUT", "CONTACT"];
  if (!validKeys.includes(sectionKey)) {
    notFound();
  }

  const history = await getAdminSectionHistory(sectionKey);

  return (
    <main style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2rem" }}>Historial: {sectionKey}</h1>
        <Link href={`/admin/content/sections/${sectionKey}`} style={{ padding: "8px 16px", backgroundColor: "#fff", color: "#333", border: "1px solid #ccc", textDecoration: "none", borderRadius: "4px" }}>
          Volver
        </Link>
      </div>
      
      {history.length === 0 ? (
        <p>No hay historial todavía.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {history.map((ver, idx) => {
            const isLatest = idx === 0;
            return (
              <div key={ver.id} style={{ padding: "20px", backgroundColor: "#fff", border: "1px solid #eaeaea", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <h3 style={{ margin: "0 0 10px 0" }}>
                    v{ver.versionNumber} {ver.title ? `- ${ver.title}` : ""}
                    {isLatest && <span style={{ marginLeft: "10px", padding: "2px 8px", backgroundColor: "#e6f4ea", color: "#1e8e3e", fontSize: "0.8rem", borderRadius: "10px" }}>Actual</span>}
                  </h3>
                  <span style={{ color: "#666", fontSize: "0.9rem" }}>
                    {new Date(ver.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <p style={{ margin: "0 0 10px 0", color: "#444" }}><strong>Resumen:</strong> {ver.changeSummary}</p>
                {ver.restoredFromVersionId && (
                  <p style={{ margin: "0 0 10px 0", color: "#1655f8", fontSize: "0.9rem" }}>Restaurado de otra versión</p>
                )}
                
                {!isLatest && (
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #eaeaea" }}>
                    <RestoreSectionForm sectionKey={sectionKey} sourceVersionId={ver.id} versionNumber={ver.versionNumber} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
