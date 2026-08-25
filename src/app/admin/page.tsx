import { requireAdmin } from "@/server/auth/authorization";
import Link from "next/link";
import { PrivateHeader } from "@/components/layout/private-header";
import styles from "./admin.module.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administración | DevNova",
  description: "Panel de administración de DevNova",
};

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <main className="private-page">
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Panel de Administración</h1>
        <p className={styles.pageSubtitle}>Bienvenido al área de gestión global del sistema.</p>
      </div>

      <div className={styles.grid}>
        <Link href="/dashboard/blogs" className={styles.card}>
          <h3 className={styles.cardTitle}>Blogs</h3>
          <span className={styles.cardLink}>Gestionar →</span>
        </Link>
        <Link href="/admin/authors" className={styles.card}>
          <h3 className={styles.cardTitle}>Autores</h3>
          <span className={styles.cardLink}>Gestionar →</span>
        </Link>
        <Link href="/admin/content" className={styles.card}>
          <h3 className={styles.cardTitle}>Contenido</h3>
          <span className={styles.cardLink}>Gestionar →</span>
        </Link>
        <Link href="/admin/team" className={styles.card}>
          <h3 className={styles.cardTitle}>Equipo</h3>
          <span className={styles.cardLink}>Gestionar →</span>
        </Link>
        <Link href="/admin/social" className={styles.card}>
          <h3 className={styles.cardTitle}>Redes Sociales</h3>
          <span className={styles.cardLink}>Configurar →</span>
        </Link>
        <Link href="/admin/messages" className={styles.card}>
          <h3 className={styles.cardTitle}>Mensajes</h3>
          <span className={styles.cardLink}>Ver bandeja →</span>
        </Link>
        <Link href="/admin/security" className={styles.card}>
          <h3 className={styles.cardTitle}>Seguridad</h3>
          <span className={styles.cardLink}>Configurar →</span>
        </Link>
        <Link href="/admin/blogs/trash" className={styles.card}>
          <h3 className={styles.cardTitle}>Papelera de Blogs</h3>
          <span className={styles.cardLink}>Ver papelera →</span>
        </Link>
        <Link href="/admin/media/trash" className={styles.card}>
          <h3 className={styles.cardTitle}>Papelera de Medios</h3>
          <span className={styles.cardLink}>Ver papelera →</span>
        </Link>
        <Link href="/admin/audit" className={styles.card}>
          <h3 className={styles.cardTitle}>Auditoría</h3>
          <span className={styles.cardLink}>Ver registros →</span>
        </Link>
      </div>
    </main>
  );
}
