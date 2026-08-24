import { requireAdmin } from "@/server/auth/authorization";
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
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: "2.25rem", margin: 0, color: "#121419" }}>
          Panel de Administración
        </h1>
        <p style={{ fontFamily: "'Space Grotesk', Arial, sans-serif", color: "#51545a", marginTop: "8px" }}>
          Bienvenido al área de gestión global del sistema.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card} style={{ borderColor: "#155eef", borderStyle: "solid", borderWidth: "1px" }}>
          <h3 className={styles.cardTitle}>Blogs</h3>
          <a href="/dashboard/blogs" style={{ 
            fontFamily: "'IBM Plex Mono', Consolas, monospace", 
            fontSize: "0.85rem", 
            fontWeight: 600, 
            color: "#155eef", 
            textDecoration: "none" 
          }}>
            Gestionar →
          </a>
        </div>
        <div className={styles.card} style={{ borderColor: "#155eef", borderStyle: "solid", borderWidth: "1px" }}>
          <h3 className={styles.cardTitle}>Autores</h3>
          <a href="/admin/authors" style={{ 
            fontFamily: "'IBM Plex Mono', Consolas, monospace", 
            fontSize: "0.85rem", 
            fontWeight: 600, 
            color: "#155eef", 
            textDecoration: "none" 
          }}>
            Gestionar →
          </a>
        </div>
        <div className={styles.card} style={{ borderColor: "#155eef", borderStyle: "solid", borderWidth: "1px" }}>
          <h3 className={styles.cardTitle}>Papelera de Blogs</h3>
          <a href="/admin/blogs/trash" style={{ 
            fontFamily: "'IBM Plex Mono', Consolas, monospace", 
            fontSize: "0.85rem", 
            fontWeight: 600, 
            color: "#155eef", 
            textDecoration: "none" 
          }}>
            Ver papelera →
          </a>
        </div>
        <div className={styles.card} style={{ borderColor: "#155eef", borderStyle: "solid", borderWidth: "1px" }}>
          <h3 className={styles.cardTitle}>Papelera de Medios</h3>
          <a href="/admin/media/trash" style={{ 
            fontFamily: "'IBM Plex Mono', Consolas, monospace", 
            fontSize: "0.85rem", 
            fontWeight: 600, 
            color: "#155eef", 
            textDecoration: "none" 
          }}>
            Ver papelera →
          </a>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Mensajes</h3>
          <span className={styles.cardStatus}>Próximamente</span>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Auditoría</h3>
          <span className={styles.cardStatus}>Próximamente</span>
        </div>
        <div className={styles.card} style={{ borderColor: "#155eef", borderStyle: "solid", borderWidth: "1px" }}>
          <h3 className={styles.cardTitle}>Seguridad</h3>
          <a href="/admin/security" style={{ 
            fontFamily: "'IBM Plex Mono', Consolas, monospace", 
            fontSize: "0.85rem", 
            fontWeight: 600, 
            color: "#155eef", 
            textDecoration: "none" 
          }}>
            Configurar →
          </a>
        </div>
        <div className={styles.card} style={{ borderColor: "#155eef", borderStyle: "solid", borderWidth: "1px" }}>
          <h3 className={styles.cardTitle}>Contenido Institucional</h3>
          <a href="/admin/content" style={{ 
            fontFamily: "'IBM Plex Mono', Consolas, monospace", 
            fontSize: "0.85rem", 
            fontWeight: 600, 
            color: "#155eef", 
            textDecoration: "none" 
          }}>
            Gestionar →
          </a>
        </div>
        <div className={styles.card} style={{ borderColor: "#155eef", borderStyle: "solid", borderWidth: "1px" }}>
          <h3 className={styles.cardTitle}>Equipo</h3>
          <a href="/admin/team" style={{ 
            fontFamily: "'IBM Plex Mono', Consolas, monospace", 
            fontSize: "0.85rem", 
            fontWeight: 600, 
            color: "#155eef", 
            textDecoration: "none" 
          }}>
            Gestionar →
          </a>
        </div>
        <div className={styles.card} style={{ borderColor: "#155eef", borderStyle: "solid", borderWidth: "1px" }}>
          <h3 className={styles.cardTitle}>Redes Sociales</h3>
          <a href="/admin/social" style={{ 
            fontFamily: "'IBM Plex Mono', Consolas, monospace", 
            fontSize: "0.85rem", 
            fontWeight: 600, 
            color: "#155eef", 
            textDecoration: "none" 
          }}>
            Configurar →
          </a>
        </div>
      </div>
    </main>
  );
}
