import { getPublicSiteProfile, getPublicSection } from "@/server/site/public-site-service";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import Link from "next/link";
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
