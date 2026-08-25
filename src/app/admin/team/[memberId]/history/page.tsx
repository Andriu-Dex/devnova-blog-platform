import { requireAdmin } from "@/server/auth/authorization";
import { getTeamMemberHistory } from "@/server/team/team-service";
import Link from "next/link";
import { notFound } from "next/navigation";
import RestoreTeamForm from "./restore-team-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Historial de Integrante | DevNova",
};

export default async function TeamMemberHistoryPage({ params }: { params: { memberId: string } }) {
  await requireAdmin();
  
  const { memberId } = params;
  const history = await getTeamMemberHistory(memberId);
  
  if (history.length === 0) {
    notFound();
  }

  const latestVersionNumber = history[0].versionNumber;

  return (
    <main style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Historial de Integrante</h1>
        <Link href={`/admin/team/${memberId}/edit`} style={{ padding: "10px 20px", backgroundColor: "#fff", color: "#333", textDecoration: "none", borderRadius: "4px", border: "1px solid #ccc", fontWeight: "bold" }}>
          Volver a Edición
        </Link>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {history.map((version) => {
          const isLatest = version.versionNumber === latestVersionNumber;
          return (
            <div key={version.id} style={{ 
              padding: "20px", 
              backgroundColor: "#fff", 
              border: isLatest ? "2px solid #12b76a" : "1px solid #eaeaea", 
              borderRadius: "8px",
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "flex-start" 
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <h3 style={{ fontSize: "1.2rem", margin: 0 }}>
                    v{version.versionNumber}: {version.fullName}
                  </h3>
                  {isLatest && (
                    <span style={{ backgroundColor: "#d1fadf", color: "#039855", padding: "2px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold" }}>
                      Actual
                    </span>
                  )}
                  {version.restoredFromVersionId && (
                    <span style={{ backgroundColor: "#f0f4ff", color: "#1655f8", padding: "2px 8px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: "bold" }}>
                      Restaurado
                    </span>
                  )}
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 20px", fontSize: "0.95rem", color: "#555" }}>
                  <span style={{ fontWeight: "bold", color: "#333" }}>Cargo:</span>
                  <span>{version.roleTitle}</span>
                  
                  <span style={{ fontWeight: "bold", color: "#333" }}>Estado:</span>
                  <span style={{ color: version.isVisible ? "#12b76a" : "#f79009" }}>{version.isVisible ? "Visible" : "Oculto"} (Orden: {version.displayOrder})</span>
                  
                  <span style={{ fontWeight: "bold", color: "#333" }}>Foto:</span>
                  <span>{version.photoMediaAssetId ? "Sí" : "No"}</span>
                  
                  <span style={{ fontWeight: "bold", color: "#333" }}>Resumen:</span>
                  <span style={{ fontStyle: "italic" }}>&quot;{version.changeSummary}&quot;</span>
                  
                  <span style={{ fontWeight: "bold", color: "#333" }}>Fecha:</span>
                  <span>{version.createdAt.toLocaleString()}</span>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                <RestoreTeamForm 
                  memberId={memberId} 
                  sourceVersionId={version.id} 
                  isDisabled={isLatest} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
