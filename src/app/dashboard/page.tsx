import { requireAuthorOrAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import styles from "./dashboard.module.css";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard | DevNova",
  description: "Panel de publicaciones de DevNova",
};

export default async function DashboardPage() {
  const user = await requireAuthorOrAdmin();

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: "2.25rem", margin: 0, color: "#121419" }}>
          Panel de Publicaciones
        </h1>
        <p style={{ fontFamily: "'Space Grotesk', Arial, sans-serif", color: "#51545a", marginTop: "8px" }}>
          Aquí podrás crear y gestionar el contenido.
        </p>
      </div>

      <div className={styles.emptyState} style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
        <Link href="/dashboard/blogs" className={styles.actionButton} style={{ textDecoration: "none" }}>
          Gestión de Blogs
        </Link>
        <Link href="/dashboard/media" className={styles.actionButton} style={{ textDecoration: "none", backgroundColor: "#155eef" }}>
          Multimedia
        </Link>
      </div>

      {user.role === "ADMIN" && (
        <div style={{ textAlign: "center" }}>
          <Link href="/admin" className={styles.adminLink}>
            Ir al panel administrativo →
          </Link>
        </div>
      )}
    </main>
  );
}
