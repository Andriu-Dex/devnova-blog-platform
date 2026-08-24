import Link from "next/link";
import { requireAdmin } from "@/server/auth/authorization";
import { listAdminTeamMembers } from "@/server/team/team-service";
import { RecoverMemberButton } from "./recover-button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Papelera de Equipo | DevNova",
};

export default async function AdminTeamTrashPage() {
  await requireAdmin();
  
  // Obtener solo eliminados
  const members = await listAdminTeamMembers(true);

  return (
    <main style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2rem", margin: 0, color: "#d92d20" }}>Papelera de Equipo</h1>
        <Link href="/admin/team" style={{ padding: "10px 20px", backgroundColor: "#fff", color: "#333", textDecoration: "none", borderRadius: "4px", fontWeight: "bold", border: "1px solid #ccc" }}>
          Volver a Equipo
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {members.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #eaeaea" }}>
            <p style={{ color: "#666", fontSize: "1.1rem" }}>La papelera está vacía.</p>
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
                  <h3 style={{ fontSize: "1.2rem", margin: "0 0 5px 0", textDecoration: "line-through", color: "#999" }}>{member.fullName}</h3>
                  <p style={{ color: "#999", margin: "0 0 5px 0", fontSize: "0.95rem" }}>{member.roleTitle}</p>
                  <div style={{ display: "flex", gap: "10px", fontSize: "0.85rem", color: "#d92d20", fontFamily: "'IBM Plex Mono', Consolas, monospace" }}>
                    <span>Eliminado el {member.deletedAt?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <RecoverMemberButton memberId={member.id} memberName={member.fullName} />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
