import { requireAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { listDeletedBlogs } from "@/server/blogs/blog-service";
import styles from "../../../dashboard/blogs/blogs.module.css";
import { Metadata } from "next";
import Link from "next/link";
import { RecoverBlogButton } from "./recover-button";
import { recoverBlogAction } from "@/app/dashboard/blogs/actions";

export const metadata: Metadata = {
  title: "Papelera de Blogs | DevNova Admin",
};

export default async function TrashBlogsPage() {
  const user = await requireAdmin();
  const blogs = await listDeletedBlogs();

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Papelera de Blogs</h1>
          <Link href="/admin" className={styles.subtitle}>
            ← Volver al panel de administración
          </Link>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Detalles del Blog</th>
              <th className={styles.th}>Autoría Original</th>
              <th className={styles.th}>Eliminado en</th>
              <th className={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {blogs.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.td} style={{ textAlign: "center", color: "#74777e" }}>
                  No hay blogs en la papelera.
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
                      <span style={{ fontSize: "0.85rem", color: "#51545a", display: "block" }}>
                        /{blog.slug} (Última versión: v{blog.versionNumber})
                      </span>
                    </td>
                    <td className={tdClass}>
                      <span style={{ fontSize: "0.9rem" }}>{blog.creatorName}</span>
                    </td>
                    <td className={tdClass}>
                      <span style={{ fontSize: "0.85rem", color: "#4b5563" }}>
                        {blog.deletedAt.toLocaleString()}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <RecoverBlogButton blogId={blog.id} onRecover={recoverBlogAction} />
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
