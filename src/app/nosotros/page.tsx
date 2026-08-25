import { getPublicSiteProfile, getPublicSection, getPublicTeamMembers } from "@/server/site/public-site-service";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import { Metadata } from "next";
import Image from "next/image";
import styles from "./nosotros.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicSiteProfile();
  return {
    title: profile?.groupName ? `${profile.groupName} | Nosotros` : "DevNova | Nosotros",
    description: "Conoce más sobre nuestra institución, historia y visión.",
  };
}

export default async function NosotrosPage() {
  const aboutSection = await getPublicSection("ABOUT");
  const missionSection = await getPublicSection("MISSION");
  const visionSection = await getPublicSection("VISION");
  const teamMembers = await getPublicTeamMembers();

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main style={{ flex: 1 }}>
        {/* ── PAGE HEADER ───────────────────────────────────────────── */}
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderInner}>
            <span className={styles.pageEyebrow}>/nosotros</span>
            <h1 className={styles.pageTitle}>Nosotros</h1>
          </div>
        </header>

        <div className={styles.content}>
          {/* ── ABOUT ───────────────────────────────────────────────── */}
          {aboutSection ? (
            <section aria-labelledby="about-title" className={styles.aboutSection}>
              <span className={styles.sectionLabel}>Sobre nosotros</span>
              {aboutSection.title && (
                <h2 id="about-title" className={styles.aboutTitle}>{aboutSection.title}</h2>
              )}
              <MarkdownRenderer content={aboutSection.contentMarkdown} allowMedia={false} />
            </section>
          ) : (
            <p className={styles.aboutEmpty}>El contenido de esta sección aún no ha sido publicado.</p>
          )}

          {/* ── MISSION / VISION ──────────────────────────────────── */}
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

          {/* ── TEAM ─────────────────────────────────────────────── */}
          <section className={styles.teamSection} aria-labelledby="team-heading">
            <span className={styles.sectionLabel}>Equipo</span>
            <h2 id="team-heading" className={styles.teamTitle}>Nuestro Equipo</h2>
            <p className={styles.teamSubtitle}>Conoce a las personas detrás de DevNova.</p>

            {teamMembers.length === 0 ? (
              <p className={styles.teamEmpty}>El equipo todavía no ha sido publicado.</p>
            ) : (
              <div className={styles.teamGrid}>
                {teamMembers.map((member) => (
                  <article key={member.id} className={styles.memberCard}>
                    <div className={styles.memberPhoto}>
                      {member.photoPublicId ? (
                        <Image
                          src={`https://res.cloudinary.com/db7y9bmbw/image/upload/c_fill,w_600,h_440,g_face/v1/${member.photoPublicId}`}
                          alt={member.photoAltText || member.fullName}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          style={{ objectFit: "cover" }}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.memberInitial} aria-hidden="true">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={styles.memberBody}>
                      <h3 className={styles.memberName}>{member.fullName}</h3>
                      <p className={styles.memberRole}>{member.roleTitle || "Integrante"}</p>
                      {member.bioMarkdown && (
                        <div className={styles.memberBio}>
                          <MarkdownRenderer content={member.bioMarkdown} allowMedia={false} />
                        </div>
                      )}
                      {(member.githubUrl || member.linkedinUrl) && (
                        <div className={styles.memberLinks}>
                          {member.githubUrl && member.githubUrl.startsWith("https://") && (
                            <a
                              href={member.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.memberLink}
                              aria-label={`GitHub de ${member.fullName}`}
                            >
                              GitHub ↗
                            </a>
                          )}
                          {member.linkedinUrl && member.linkedinUrl.startsWith("https://") && (
                            <a
                              href={member.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.memberLink}
                              aria-label={`LinkedIn de ${member.fullName}`}
                            >
                              LinkedIn ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
