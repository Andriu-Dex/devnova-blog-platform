import { searchPublishedBlogs } from "@/server/blogs/public-blog-service";
import { getDeliveryUrl } from "@/server/media/cloudinary";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import styles from "./blogs.module.css";

export const dynamic = "force-dynamic";

const baseMetadata: Metadata = {
  title: "DevNova | Blog",
  description: "Últimas publicaciones y artículos de DevNova.",
  alternates: { canonical: "/blogs" },
};

export async function generateMetadata(
  props: { searchParams: Promise<{ q?: string }> }
): Promise<Metadata> {
  const sp = await props.searchParams;
  if (sp.q) {
    return {
      ...baseMetadata,
      robots: { index: false, follow: true },
    };
  }
  return baseMetadata;
}

export default async function PublicBlogsPage(props: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await props.searchParams;
  const q = sp.q || "";
  const page = parseInt(sp.page || "1", 10) || 1;

  // Si no hay búsqueda, mostramos todo paginado, pero como la función soporta `q` opcional, la llamamos siempre.
  // Wait, no he importado searchPublishedBlogs. Let's fix that too, I will add it at the top manually.

  const { items, total, totalPages } = await searchPublishedBlogs({ query: q, page });
  const [featured, ...rest] = items;
  
  const hasSearch = q.length > 0;

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main style={{ flex: 1 }}>
        {/* ── PAGE HEADER ─────────────────────────────────────────── */}
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderInner}>
            <span className={styles.pageEyebrow}>/blog</span>
            <h1 className={styles.pageTitle}>Blog</h1>
            <p className={styles.pageSubtitle}>Ideas, tutoriales y novedades del equipo.</p>
            
            {/* Search Form */}
            <form action="/blogs" method="GET" className={styles.searchForm}>
              <label htmlFor="q" className="sr-only">Buscar publicaciones</label>
              <input 
                type="search" 
                id="q" 
                name="q" 
                defaultValue={q} 
                placeholder="Buscar publicaciones..." 
                maxLength={100}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>Buscar</button>
            </form>
            
            {hasSearch && (
              <div className={styles.searchResultsInfo}>
                <span>{total === 1 ? '1 publicación encontrada' : `${total} publicaciones encontradas`} para &quot;{q}&quot;</span>
                <Link href="/blogs" className={styles.clearSearch}>Limpiar búsqueda</Link>
              </div>
            )}
          </div>
        </header>

        <div className={styles.content}>
          {items.length === 0 ? (
            <div className={styles.empty} role="status">
              <p className={styles.emptyTitle}>
                {hasSearch ? "No encontramos publicaciones para esta búsqueda." : "Aún no hay publicaciones disponibles."}
              </p>
              {hasSearch && (
                <Link href="/blogs" className={styles.emptyLink}>Ver todas las publicaciones</Link>
              )}
            </div>
          ) : (
            <>
              {/* Featured article (solo en página 1 y si NO hay búsqueda) */}
              {!hasSearch && page === 1 && featured ? (
                <Link href={`/blogs/${featured.slug}`} className={styles.featured} aria-label={`Leer artículo: ${featured.title}`}>
                  <div className={styles.featuredImageWrap}>
                    {featured.coverMediaAssetId ? (
                      <Image
                        src={getDeliveryUrl(featured.coverMediaAssetId, 900)}
                        alt={featured.coverAltText || featured.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        style={{ objectFit: "cover" }}
                        priority
                        unoptimized
                      />
                    ) : (
                      <div className={styles.featuredNoImage} aria-hidden="true">
                        {featured.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className={styles.featuredBody}>
                    <span className={styles.featuredBadge}>Destacado</span>
                    <h2 className={styles.featuredTitle}>{featured.title}</h2>
                    <p className={styles.featuredSummary}>{featured.summary}</p>
                    <div className={styles.featuredMeta}>
                      <span>{featured.creatorName}</span>
                      <span>·</span>
                      <time dateTime={new Date(featured.publishedAt).toISOString()}>
                        {new Date(featured.publishedAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
                      </time>
                    </div>
                    <span className={styles.featuredReadMore} aria-hidden="true">Leer artículo →</span>
                  </div>
                </Link>
              ) : null}

              {/* Rest grid */}
              {(hasSearch || page > 1 || rest.length > 0) && (
                <section aria-label="Artículos">
                  {(!hasSearch && page === 1) && <p className={styles.gridTitle}>Más artículos</p>}
                  <div className={styles.grid}>
                    {(hasSearch || page > 1 ? items : rest).map((blog) => (
                      <Link key={blog.slug} href={`/blogs/${blog.slug}`} className={styles.card} aria-label={`Leer: ${blog.title}`}>
                        <div className={styles.cardImageWrap}>
                          {blog.coverMediaAssetId ? (
                            <Image
                              src={getDeliveryUrl(blog.coverMediaAssetId, 600)}
                              alt={blog.coverAltText || blog.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 360px"
                              style={{ objectFit: "cover" }}
                              unoptimized
                            />
                          ) : (
                            <div className={styles.cardNoImage} aria-hidden="true">
                              {blog.title.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className={styles.cardBody}>
                          <h2 className={styles.cardTitle}>{blog.title}</h2>
                          <p className={styles.cardSummary}>{blog.summary}</p>
                          <div className={styles.cardMeta}>
                            <span>{blog.creatorName}</span>
                            <time dateTime={new Date(blog.publishedAt).toISOString()}>
                              {new Date(blog.publishedAt).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}
                            </time>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              
              {/* Paginación */}
              {totalPages > 1 && (
                <nav className={styles.pagination} aria-label="Paginación de blogs">
                  <div className={styles.paginationControls}>
                    {page > 1 ? (
                      <Link href={`/blogs?${new URLSearchParams({ ...(q && { q }), page: String(page - 1) }).toString()}`} className={styles.paginationBtn}>Anterior</Link>
                    ) : (
                      <span className={styles.paginationBtnDisabled}>Anterior</span>
                    )}
                    
                    <span className={styles.paginationInfo} aria-current="page">Página {page} de {totalPages}</span>
                    
                    {page < totalPages ? (
                      <Link href={`/blogs?${new URLSearchParams({ ...(q && { q }), page: String(page + 1) }).toString()}`} className={styles.paginationBtn}>Siguiente</Link>
                    ) : (
                      <span className={styles.paginationBtnDisabled}>Siguiente</span>
                    )}
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
