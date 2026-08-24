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
                <td colSpan={4} className={styles.td} style={{ textAlign: "center", color: "#74777e" }}>
                  No hay blogs disponibles.
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
                        <Link href={`/dashboard/blogs/${blog.id}/history`} className={styles.actionButton} style={{ background: "#4a4a4a" }}>
                          Historial
                        </Link>
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
