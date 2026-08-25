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
    <main className="private-page">
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Panel de Publicaciones</h1>
        <p className={styles.pageSubtitle}>Aquí podrás crear y gestionar el contenido.</p>
      </div>

      <div className={styles.grid}>
        <Link href="/dashboard/blogs" className={styles.card}>
          <h3 className={styles.cardTitle}>Blogs</h3>
          <span className={styles.cardLink}>Gestionar publicaciones →</span>
        </Link>
        <Link href="/dashboard/media" className={styles.card}>
          <h3 className={styles.cardTitle}>Multimedia</h3>
          <span className={styles.cardLink}>Gestionar archivos →</span>
        </Link>
        <Link href="/account/change-password" className={styles.card}>
          <h3 className={styles.cardTitle}>Mi Cuenta</h3>
          <span className={styles.cardLink}>Cambiar contraseña →</span>
        </Link>
        {user.role === "ADMIN" && (
          <Link href="/admin" className={styles.card} style={{ borderColor: "var(--color-carbon)" }}>
            <h3 className={styles.cardTitle}>Administración</h3>
            <span className={styles.cardLink} style={{ color: "var(--color-carbon)" }}>Ir al panel global →</span>
          </Link>
        )}
      </div>
    </main>
  );
}
