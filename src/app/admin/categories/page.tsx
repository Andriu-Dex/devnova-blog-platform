import { requireAdmin } from "@/server/auth/authorization";
import { listBlogCategoriesWithPublishedCounts } from "@/server/blogs/category-service";
import { PrivateHeader } from "@/components/layout/private-header";
import Link from "next/link";
import { Metadata } from "next";
import { deleteCategoryAction } from "./actions";
import styles from "../authors/authors.module.css";

export const metadata: Metadata = {
  title: "Categorías | DevNova",
  description: "Gestiona las categorías de blogs",
};

export default async function CategoriesPage() {
  const user = await requireAdmin();
  const categories = await listBlogCategoriesWithPublishedCounts();

  return (
    <main className="private-page">
      <PrivateHeader displayName={user.displayName} role={user.role} />

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Categorías</h1>
          <Link href="/admin" className={styles.subtitle}>
            Volver al panel administrativo
          </Link>
        </div>
        <Link href="/admin/categories/new" className={styles.createButton}>
          Crear categoría
        </Link>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Nombre</th>
              <th className={styles.th}>Slug</th>
              <th className={styles.th}>Color</th>
              <th className={styles.th}>Orden</th>
              <th className={styles.th}>Publicados</th>
              <th className={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.td} style={{ textAlign: "center", color: "#74777e" }}>
                  No hay categorías activas.
                </td>
              </tr>
            ) : (
              categories.map((category, index) => {
                const tdClass = index === categories.length - 1 ? styles.tdLast : styles.td;
                return (
                  <tr key={category.id}>
                    <td className={tdClass}>
                      <strong>{category.name}</strong>
                    </td>
                    <td className={tdClass}>{category.slug}</td>
                    <td className={tdClass}>{category.colorClass || "blog"}</td>
                    <td className={tdClass}>{category.displayOrder}</td>
                    <td className={tdClass}>{category.publishedCount}</td>
                    <td className={tdClass}>
                      <Link href={`/admin/categories/${category.id}/edit`} className={styles.actionButton}>
                        Editar
                      </Link>
                      <form action={deleteCategoryAction} style={{ display: "inline" }}>
                        <input type="hidden" name="categoryId" value={category.id} />
                        <button
                          type="submit"
                          className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                          disabled={category.publishedCount > 0}
                          title={category.publishedCount > 0 ? "No se puede eliminar una categoría con blogs activos" : "Eliminar categoría"}
                        >
                          Eliminar
                        </button>
                      </form>
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
