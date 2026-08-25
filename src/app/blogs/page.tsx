import { listPublishedBlogs } from "@/server/blogs/public-blog-service";
import { getDeliveryUrl } from "@/server/media/cloudinary";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import styles from "./blogs.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DevNova | Blog",
  description: "Últimas publicaciones y artículos de DevNova.",
  alternates: { canonical: "/blogs" },
};

export default async function PublicBlogsPage() {
  const blogs = await listPublishedBlogs();
  const [featured, ...rest] = blogs;

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
          </div>
        </header>

        <div className={styles.content}>
          {blogs.length === 0 ? (
            <div className={styles.empty} role="status">
              <p className={styles.emptyTitle}>Aún no hay publicaciones.</p>
              <p className={styles.emptyText}>Vuelve pronto para leer nuestros artículos.</p>
            </div>
          ) : (
            <>
              {/* Featured article */}
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

              {/* Rest grid */}
              {rest.length > 0 && (
                <section aria-label="Más artículos">
                  <p className={styles.gridTitle}>Más artículos</p>
                  <div className={styles.grid}>
                    {rest.map((blog) => (
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
            </>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
