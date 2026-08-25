import { getPublicSiteProfile, getPublicSection } from "@/server/site/public-site-service";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import { ContactForm } from "@/components/contact/contact-form";
import { Metadata } from "next";
import styles from "./contacto.module.css";
import { IconoTerminal } from "@/components/site/devbox-pieces";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicSiteProfile();
  return {
    title: profile?.groupName ? `${profile.groupName} | Contacto` : "DevNova | Contacto",
    description: "Contáctanos y descubre cómo comunicarte con nuestro equipo.",
  };
}

export default async function ContactoPage() {
  const contactSection = await getPublicSection("CONTACT");
  const profile = await getPublicSiteProfile();

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main>
        {/* ── CABECERA ─────────────────────────────────────────────── */}
        <header className={`${styles.contenedor} ${styles.cabeceraPagina}`}>
          <h1>Contacto</h1>
          <div>
            <p>
              Canal de comunicación abierto para consultas sobre el proyecto, colaboraciones y revisiones académicas.
            </p>
            <span className={styles.meta}>
              <IconoTerminal /> canal público · respuesta directa
            </span>
          </div>
        </header>

        {/* ── CONTENIDO ────────────────────────────────────────────── */}
        <div className={`${styles.contenedor} ${styles.content}`}>
          {/* Sidebar */}
          <aside className={styles.sidebar} aria-label="Información de contacto">
            {contactSection && (
              <div>
                <span className={styles.sectionLabel}>Información</span>
                <div className={styles.infoCard}>
                  <MarkdownRenderer content={contactSection.contentMarkdown} allowMedia={false} />
                </div>
              </div>
            )}

            {profile?.publicEmail || profile?.publicPhone ? (
              <div>
                <span className={styles.sectionLabel}>Vías directas</span>
                <div className={styles.infoCard}>
                  {profile.publicEmail && (
                    <div className={styles.contactItem}>
                      <span className={styles.contactLabel}>Email</span>
                      <a href={`mailto:${profile.publicEmail}`} className={styles.contactValue}>
                        {profile.publicEmail}
                      </a>
                    </div>
                  )}
                  {profile.publicPhone && (
                    <div className={styles.contactItem}>
                      <span className={styles.contactLabel}>Teléfono</span>
                      <a href={`tel:${profile.publicPhone}`} className={styles.contactValue}>
                        {profile.publicPhone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </aside>

          {/* Form */}
          <div className={styles.formContainer}>
            <ContactForm />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
