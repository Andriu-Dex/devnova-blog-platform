import { requireAuthorOrAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { deleteBlogAction } from "./actions";
import { DeleteBlogButton } from "./delete-button";
import { listBlogsForDashboard } from "@/server/blogs/blog-service";
import styles from "./blogs.module.css";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blogs | DevNova",
  description: "Gestión colaborativa de blogs",
};

export default async function BlogsListPage() {
  const user = await requireAuthorOrAdmin();
  const blogs = await listBlogsForDashboard();

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Blogs</h1>
          <Link href="/dashboard" className={styles.subtitle}>
            ← Volver al panel de publicaciones
          </Link>
        </div>
        <Link href="/dashboard/blogs/new" className={styles.createButton}>
          + Crear Blog
        </Link>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Detalles</th>
              <th className={styles.th}>Autoría (Original / Último)</th>
              <th className={styles.th}>Estado</th>
              <th className={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {blogs.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.td} style={{ textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "2.5rem", opacity: 0.5 }}>📝</div>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600, color: "#1f2937" }}>Aún no hay blogs</h3>
                    <p style={{ margin: 0, fontSize: "0.95rem", color: "#6b7280", maxWidth: "400px" }}>
                      El espacio de publicación está vacío. Crea tu primer blog para empezar a compartir conocimiento y novedades.
                    </p>
                    <Link href="/dashboard/blogs/new" style={{ marginTop: "8px", display: "inline-block", padding: "8px 16px", backgroundColor: "#111827", color: "white", borderRadius: "6px", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
                      Crear primer blog
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              blogs.map((blog, index) => {
                const isLast = index === blogs.length - 1;
                const tdClass = isLast ? styles.tdLast : styles.td;
                
                return (
                  <tr key={blog.id}>
                    <td className={tdClass}>
                      <strong style={{ display: "block", marginBottom: "4px" }}>{blog.title}</strong>
                      <span style={{ fontSize: "0.8rem", color: "#51545a", display: "block", marginBottom: "8px" }}>
                        /{blog.slug} (v{blog.versionNumber})
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "#74777e", display: "block", maxWidth: "400px" }}>
                        {blog.summary}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <div style={{ fontSize: "0.85rem", marginBottom: "4px" }}>
                        <span style={{ color: "#74777e" }}>Creado por:</span> {blog.originalCreatorName}
                      </div>
                      <div style={{ fontSize: "0.85rem" }}>
                        <span style={{ color: "#74777e" }}>Editado por:</span> {blog.lastEditorName}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#74777e", marginTop: "4px" }}>
                        {blog.lastVersionDate.toLocaleDateString()}
                      </div>
                    </td>
                    <td className={tdClass}>
                      {blog.published ? (
                        <>
                          <span className={`${styles.statusPill} ${styles.statusPublished}`}>
                            Publicado v{blog.publishedVersionNumber}
                          </span>
                          {blog.versionNumber > (blog.publishedVersionNumber || 0) && (
                            <span style={{ display: "block", marginTop: "4px", fontSize: "0.75rem", color: "#f5a623" }}>
                              Cambios sin publicar
                            </span>
                          )}
                        </>
                      ) : (
                        <span className={`${styles.statusPill} ${styles.statusDraft}`}>
                          No publicado
                        </span>
                      )}
                    </td>
                    <td className={tdClass}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <Link href={`/dashboard/blogs/${blog.id}/edit`} className={styles.actionButton}>
                          Editar
                        </Link>
                        <Link href={`/dashboard/blogs/${blog.id}/history`} className={styles.actionButton} style={{ background: "#475569", color: "white" }}>
                          Historial
                        </Link>
                        <Link href={`/dashboard/blogs/${blog.id}/duplicate`} className={styles.actionButton} style={{ background: "#10b981", color: "white" }}>
                          Duplicar
                        </Link>
                        <a href={`/dashboard/blogs/${blog.id}/export?version=latest`} download className={styles.actionButton} style={{ background: "#3b82f6", color: "white", textDecoration: "none" }}>
                          Exportar
                        </a>
                        {user.role === "ADMIN" && (
                          <DeleteBlogButton blogId={blog.id} onDelete={deleteBlogAction} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
