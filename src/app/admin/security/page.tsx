import { requireAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { SecurityForm } from "./security-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seguridad | DevNova",
  description: "Gestión de seguridad y credenciales",
};

export default async function SecurityPage() {
  const user = await requireAdmin();

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: "2.25rem", margin: 0, color: "#121419" }}>
          Seguridad
        </h1>
        <a href="/admin" style={{ 
          fontFamily: "'Space Grotesk', Arial, sans-serif", 
          color: "#51545a", 
          marginTop: "8px", 
          display: "inline-block", 
          textDecoration: "none" 
        }}>
          ← Volver al panel administrativo
        </a>
      </div>

      <SecurityForm />
    </main>
  );
}
