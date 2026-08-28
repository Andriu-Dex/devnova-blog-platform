import { listPublishedCategoryStats, searchPublishedBlogs } from "@/server/blogs/public-blog-service";
import { getDeliveryUrl } from "@/server/media/cloudinary";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { Metadata } from "next";
import Link from "next/link";
import styles from "./blogs.module.css";
import { BlogCard } from "@/components/site/blog-card";
import {
  IconoFlecha,
  IconoRama,
  IconoBuscar,
  IconoCerrar,
} from "@/components/site/devbox-pieces";

export const dynamic = "force-dynamic";

const baseMetadata: Metadata = {
  title: "Blogs | DevNova",
  description: "Proyectos, talleres y deberes organizados como un repositorio académico verificable.",
  alternates: { canonical: "/blogs" },
};

export async function generateMetadata(
  props: { searchParams: Promise<{ q?: string; category?: string }> }
): Promise<Metadata> {
  const sp = await props.searchParams;
  if (sp.q || sp.category) {
    return {
      ...baseMetadata,
      robots: { index: false, follow: true },
    };
  }
  return baseMetadata;
}

export default async function PublicBlogsPage(props: {
  searchParams: Promise<{ q?: string; page?: string; category?: string }>;
}) {
  const sp = await props.searchParams;
  const q = sp.q || "";
  const categorySlug = sp.category || "";
  const page = parseInt(sp.page || "1", 10) || 1;

  const [{ items, total, totalPages }, categoryStats] = await Promise.all([
    searchPublishedBlogs({ query: q, categorySlug, page, pageSize: 20 }),
    listPublishedCategoryStats(),
  ]);
  const hasSearch = q.length > 0;
  const hasCategory = categorySlug.length > 0;
  const activeCategory = categoryStats.categories.find((category) => category.slug === categorySlug);
  const makeCategoryHref = (slug?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (slug) params.set("category", slug);
    const qs = params.toString();
    return qs ? `/blogs?${qs}` : "/blogs";
  };

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main>
        {/* ── HEADER ───────────────────────────────────────────────── */}
        <header className={`${styles.contenedor} ${styles.cabeceraPagina}`}>
          <h1>Blogs</h1>
          <div>
            <p>Un semestre completo, organizado como archivos que se pueden buscar, abrir y verificar.</p>
            <span className={styles.meta}>
              {categoryStats.total} archivos / {categoryStats.categories.length} colecciones / orden reciente
            </span>
          </div>
        </header>

        {/* ── ÍNDICE DE REPOSITORIO ────────────────────────────────── */}
        <section className={`${styles.contenedor} ${styles.indiceRepo}`} aria-label="Índice de entregas">
          {/* Toolbar Carbón */}
          <div className={styles.repoToolbar}>
            <div className={styles.repoToolbarRuta}>
              <IconoRama />
              <span>devnova / <strong>main</strong> / entregas</span>
            </div>

            <form action="/blogs" method="GET" className={styles.repoBusqueda}>
              <IconoBuscar />
              {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Buscar por título, resumen o contenido..."
                maxLength={100}
                aria-label="Buscar en el repositorio"
              />
              {(hasSearch || hasCategory) && (
                <Link href={hasSearch && hasCategory ? makeCategoryHref(categorySlug) : "/blogs"} className={styles.clearBtn} aria-label="Limpiar búsqueda">
                  <IconoCerrar />
                </Link>
              )}
            </form>
          </div>

          {/* Barra de Filtros */}
          <div className={styles.filtrosRepo}>
            <Link href={makeCategoryHref()} className={styles.filtroBtn} data-active={!hasCategory ? "true" : "false"}>
              Todos <span>({categoryStats.total})</span>
            </Link>
            {categoryStats.categories.map((category) => (
              <Link
                key={category.id}
                href={makeCategoryHref(category.slug)}
                className={styles.filtroBtn}
                data-active={category.slug === categorySlug ? "true" : "false"}
              >
                {category.name} <span>({category.publishedCount})</span>
              </Link>
            ))}
          </div>

          {/* Info de Resultados */}
          <div className={styles.repoResultados}>
            <span className={styles.meta}>
              {hasSearch
                ? `Mostrando ${items.length} resultado(s) para "${q}"`
                : hasCategory
                  ? `Mostrando ${items.length} de ${total} entrega(s) en ${activeCategory?.name || categorySlug}`
                  : `Mostrando ${items.length} de ${total} entregas publicadas`}
            </span>
            {(hasSearch || hasCategory) && (
              <Link href="/blogs" className={styles.limpiarFiltros}>
                Restablecer filtros <IconoFlecha />
              </Link>
            )}
          </div>

          {/* Grid de Cards */}
          {items.length === 0 ? (
            <div className={styles.vacioRepo}>
              <div className={styles.vacioRepoCarpeta} aria-hidden="true" />
              <h2>No se encontraron blogs</h2>
              <p>
                {hasSearch
                  ? `No existen blogs que coincidan con "${q}". Intenta con otros términos.`
                  : hasCategory
                    ? `No existen blogs publicados en ${activeCategory?.name || categorySlug}.`
                  : "Aún no hay blogs publicados en el repositorio."}
              </p>
              {(hasSearch || hasCategory) && (
                <Link href="/blogs" className={`${styles.boton} ${styles.botonPapel}`}>
                  <span>Ver todos los blogs</span> <IconoFlecha />
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.blogsGrid}>
              {items.map((blog) => (
                <BlogCard
                  key={blog.slug}
                  slug={blog.slug}
                  title={blog.title}
                  summary={blog.summary}
                  author={blog.creatorName || "DevNova"}
                  date={blog.publishedAt}
                  categoryName={blog.categoryName}
                  coverUrl={blog.coverMediaPublicId ? getDeliveryUrl(blog.coverMediaPublicId, 600) : null}
                />
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className={styles.paginacion}>
              <span className={styles.meta}>
                Página {page} de {totalPages}
              </span>
              <div className={styles.paginacionControles}>
                {page > 1 && (
                  <Link
                    href={`/blogs?${new URLSearchParams({ ...(q && { q }), ...(categorySlug && { category: categorySlug }), page: String(page - 1) }).toString()}`}
                    className={`${styles.boton} ${styles.botonPapel}`}
                  >
                    <IconoFlecha direccion="izquierda" /> <span>Anterior</span>
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/blogs?${new URLSearchParams({ ...(q && { q }), ...(categorySlug && { category: categorySlug }), page: String(page + 1) }).toString()}`}
                    className={`${styles.boton} ${styles.botonPapel}`}
                  >
                    <span>Siguiente</span> <IconoFlecha />
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
