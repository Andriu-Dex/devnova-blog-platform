import Link from "next/link";
import { requireAdmin } from "@/server/auth/authorization";
import { listAdminTeamMembers } from "@/server/team/team-service";
import { DeleteMemberButton } from "./delete-button";
import { OrderForm } from "./order-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administración de Equipo | DevNova",
};

export default async function AdminTeamPage() {
  await requireAdmin();
  
  const members = await listAdminTeamMembers(false);

  return (
    <main style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Gestión de Equipo</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/admin/team/trash" style={{ padding: "10px 20px", backgroundColor: "#fff", color: "#666", textDecoration: "none", borderRadius: "4px", fontWeight: "bold", border: "1px solid #ccc" }}>
            Papelera
          </Link>
          <Link href="/admin/team/new" style={{ padding: "10px 20px", backgroundColor: "#1655f8", color: "#fff", textDecoration: "none", borderRadius: "4px", fontWeight: "bold" }}>
            + Nuevo Integrante
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {members.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #eaeaea" }}>
            <p style={{ color: "#666", fontSize: "1.1rem" }}>No hay integrantes activos en el equipo.</p>
          </div>
        ) : (
          members.map((member) => (
            <div key={member.id} style={{ padding: "20px", backgroundColor: "#fff", border: "1px solid #eaeaea", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ width: "60px", height: "60px", backgroundColor: "#f0f0f0", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {member.photoMediaAssetId ? (
                    <span style={{ fontSize: "0.8rem", color: "#999" }}>Foto</span>
                  ) : (
                    <span style={{ fontSize: "1.2rem", color: "#999", fontWeight: "bold" }}>{member.fullName.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", margin: "0 0 5px 0" }}>{member.fullName}</h3>
                  <p style={{ color: "#666", margin: "0 0 5px 0", fontSize: "0.95rem" }}>{member.roleTitle}</p>
                  <div style={{ display: "flex", gap: "10px", fontSize: "0.85rem", color: "#888", fontFamily: "'IBM Plex Mono', Consolas, monospace", alignItems: "center" }}>
                    <span>v{member.versionNumber}</span>
                    <span>•</span>
                    <OrderForm memberId={member.id} currentOrder={member.displayOrder} />
                    <span>•</span>
                    <span style={{ color: member.isVisible ? "#12b76a" : "#f79009" }}>
                      {member.isVisible ? "Visible" : "Oculto"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Link href={`/admin/team/${member.id}/history`} style={{ padding: "8px 16px", backgroundColor: "#f0f4ff", color: "#1655f8", textDecoration: "none", borderRadius: "4px", fontWeight: "bold", border: "1px solid #d0deff", fontSize: "0.85rem", fontFamily: "'IBM Plex Mono', Consolas, monospace" }}>
                  Historial
                </Link>
                <Link href={`/admin/team/${member.id}/edit`} style={{ padding: "8px 16px", backgroundColor: "#1655f8", color: "#fff", textDecoration: "none", borderRadius: "4px", fontWeight: "bold", fontSize: "0.85rem", fontFamily: "'IBM Plex Mono', Consolas, monospace" }}>
                  Editar
                </Link>
                <DeleteMemberButton memberId={member.id} memberName={member.fullName} />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
