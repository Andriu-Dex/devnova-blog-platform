import { requireAdmin } from "@/server/auth/authorization";
import { getAdminProfileVersion } from "@/server/site/site-content-service";
import ProfileForm from "./profile-form";
import Link from "next/link";

export default async function AdminProfilePage() {
  await requireAdmin();
  const latestProfile = await getAdminProfileVersion();

  return (
    <main style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "2rem" }}>Editar Perfil Institucional</h1>
        <Link href="/admin/content/profile/history" style={{ padding: "8px 16px", backgroundColor: "#f0f4ff", color: "#1655f8", textDecoration: "none", borderRadius: "4px", border: "1px solid #d0deff", fontWeight: "bold" }}>
          Ver Historial
        </Link>
      </div>
      
      <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "8px", border: "1px solid #eaeaea" }}>
        <ProfileForm initialData={latestProfile} />
      </div>
    </main>
  );
}
