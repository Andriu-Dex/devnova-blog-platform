import { getPublicSiteProfile, getPublicSection } from "@/server/site/public-site-service";
import { listRecentPublishedBlogs } from "@/server/blogs/public-blog-service";
import { getDeliveryUrl } from "@/server/media/cloudinary";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicSiteProfile();
  return {
    title: profile?.groupName ? `${profile.groupName} | Inicio` : "DevNova | Inicio",
    description: profile?.tagline || "Bienvenido a nuestro sitio institucional",
  };
}

export default async function HomePage() {
  const profile = await getPublicSiteProfile();
  const homeSection = await getPublicSection("HOME");
  const missionSection = await getPublicSection("MISSION");
  const visionSection = await getPublicSection("VISION");
  const recentBlogs = await listRecentPublishedBlogs(3);

  const brandName = profile?.groupName || "DevNova";

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main style={{ flex: 1 }}>
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className={styles.hero} aria-label="Presentación">
          <div className={styles.heroInner}>
            <div>
              <span className={styles.heroEyebrow}>
                <span className={styles.heroDot} aria-hidden="true" />
                Plataforma editorial
              </span>
              <h1 className={styles.heroTitle}>{brandName}</h1>
              {profile?.tagline && (
                <p className={styles.heroTagline}>{profile.tagline}</p>
              )}
              <div className={styles.heroCtas}>
                <Link href="/blogs" className={styles.ctaPrimary}>
                  Ver publicaciones
                </Link>
                <Link href="/nosotros" className={styles.ctaSecondary}>
                  Conocenos
                </Link>
              </div>
            </div>

            <div className={styles.heroBadge} aria-hidden="true">
              <span className={styles.heroBadgeLabel}>
                Blog
                <br />
                Editorial
              </span>
            </div>
          </div>
        </section>

        {/* ── CONTENT SECTIONS ─────────────────────────────────────── */}
        <div className={styles.sections}>
          {homeSection && (
            <section aria-labelledby="home-section-title">
              <span className={styles.sectionLabel}>Contenido</span>
              {homeSection.title && (
                <h2 id="home-section-title" className={styles.sectionTitle}>{homeSection.title}</h2>
              )}
              <div className={styles.articleCard}>
                <MarkdownRenderer content={homeSection.contentMarkdown} allowMedia={false} />
              </div>
            </section>
          )}

          {(missionSection || visionSection) && (
            <section aria-label="Misión y Visión">
              <span className={styles.sectionLabel}>Propósito</span>
              <div className={styles.mvGrid}>
                {missionSection && (
                  <article className={styles.mvCard}>
                    <h3 className={styles.mvTitle}>{missionSection.title || "Misión"}</h3>
                    <MarkdownRenderer content={missionSection.contentMarkdown} allowMedia={false} />
                  </article>
                )}
                {visionSection && (
                  <article className={styles.mvCard}>
                    <h3 className={styles.mvTitle}>{visionSection.title || "Visión"}</h3>
                    <MarkdownRenderer content={visionSection.contentMarkdown} allowMedia={false} />
                  </article>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ── RECENT BLOGS ─────────────────────────────────────────── */}
        {recentBlogs.length > 0 && (
          <section className={styles.recentBlogs} aria-label="Publicaciones recientes">
            <div className={styles.recentBlogsInner}>
              <h2 className={styles.sectionTitle}>Publicaciones recientes</h2>
              <div className={styles.recentGrid}>
                {recentBlogs.map((blog) => (
                  <Link key={blog.slug} href={`/blogs/${blog.slug}`} className={styles.blogCard}>
                    <div className={styles.blogCardImageWrap}>
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
                        <div className={styles.blogCardNoImage} aria-hidden="true">
                          {blog.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className={styles.blogCardBody}>
                      <h3 className={styles.blogCardTitle}>{blog.title}</h3>
                      <p className={styles.blogCardSummary}>{blog.summary}</p>
                      <div className={styles.blogCardMeta}>
                        <span>{blog.creatorName}</span>
                        <time dateTime={new Date(blog.publishedAt).toISOString()}>
                          {new Intl.DateTimeFormat("es-ES", { year: "numeric", month: "short", day: "numeric" }).format(new Date(blog.publishedAt))}
                        </time>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA STRIP ────────────────────────────────────────────── */}
        <div className={styles.ctaStrip}>
          <div className={styles.ctaStripInner}>
            <p className={styles.ctaStripTitle}>¿Listo para explorar?</p>
            <div className={styles.ctaStripLinks}>
              <Link href="/blogs" className={styles.ctaPaperLink}>
                Ir al Blog
              </Link>
              <Link href="/contacto" className={styles.ctaPaperLink}>
                Contáctanos
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
