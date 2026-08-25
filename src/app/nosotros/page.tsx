import { getPublicSiteProfile, getPublicSection, getPublicTeamMembers } from "@/server/site/public-site-service";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./nosotros.module.css";
import {
  IconoFlecha,
  IconoRama,
  IconoTerminal,
  IconoGitHub,
} from "@/components/site/devbox-pieces";
import { buildCloudinaryFillUrl } from "@/lib/cloudinary-url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicSiteProfile();
  return {
    title: profile?.groupName ? `${profile.groupName} | Nosotros` : "DevNova | Nosotros",
    description: "El equipo que construye y documenta DevNova durante el semestre.",
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

      <main>
        {/* ── HERO NOSOTROS ────────────────────────────────────────── */}
        <header className={`${styles.contenedor} ${styles.nosotrosHero}`}>
          <div className={styles.nosotrosHeroTitulo}>
            <h1>Nosotros</h1>
            <p>
              {aboutSection?.contentMarkdown ||
                "Seis personas construyendo, probando y documentando el mismo repositorio de aprendizaje."}
            </p>
          </div>

          <div className={styles.nosotrosHeroTerminal}>
            <div className={styles.meta}>
              <IconoTerminal /> team.config
            </div>
            <p>
              <span>materia:</span> Desarrollo Asistido por Software
            </p>
            <p>
              <span>integrantes:</span> {teamMembers.length || 6}
            </p>
            <p>
              <span>principio:</span> evidencia compartida
            </p>
            <div className={styles.nosotrosHeroRama}>
              <IconoRama />
              <span>main</span>
              <i />
              <span>aprender</span>
            </div>
          </div>
        </header>

        {/* ── MISIÓN Y VISIÓN (HOJAS FLOTANTES SOBRE FONDO AZUL) ──── */}
        <section className={styles.seccionAzul} aria-label="Misión y visión">
          <div className={`${styles.contenedor} ${styles.declaraciones}`}>
            {/* Hoja Misión */}
            <article className={`${styles.declaracionHoja} ${styles.declaracionHojaMision}`}>
              <div className={`${styles.declaracionHojaBarra} ${styles.meta}`}>
                <span>docs/mision.md</span>
                <span>confirmado</span>
              </div>
              <h2>{missionSection?.title || "Misión"}</h2>
              <div className={styles.declaracionCuerpo}>
                <MarkdownRenderer
                  content={
                    missionSection?.contentMarkdown ||
                    "Construir y documentar soluciones de software con rigor metodológico y evidencia verificable, fortaleciendo el aprendizaje colaborativo a lo largo del semestre."
                  }
                  allowMedia={false}
                />
              </div>
            </article>

            {/* Hoja Visión */}
            <article className={`${styles.declaracionHoja} ${styles.declaracionHojaVision}`}>
              <div className={`${styles.declaracionHojaBarra} ${styles.meta}`}>
                <span>docs/vision.md</span>
                <span>confirmado</span>
              </div>
              <h2>{visionSection?.title || "Visión"}</h2>
              <div className={styles.declaracionCuerpo}>
                <MarkdownRenderer
                  content={
                    visionSection?.contentMarkdown ||
                    "Consolidar un repositorio académico modelo que refleje la evolución de habilidades en análisis, diseño, pruebas y despliegue continuo de software."
                  }
                  allowMedia={false}
                />
              </div>
            </article>
          </div>
        </section>

        {/* ── CONTRIBUIDORES / EQUIPO ──────────────────────────────── */}
        <section className={`${styles.contenedor} ${styles.seccion} ${styles.equipoSeccion}`} aria-labelledby="titulo-equipo">
          <div className={`${styles.seccionCabecera} ${styles.seccionCabeceraFila}`}>
            <div>
              <h2 id="titulo-equipo">Contribuidores</h2>
              <p>La autoría se declara en cada entrega y se comprueba en el historial del trabajo.</p>
            </div>
            <span className={styles.meta}>
              {teamMembers.length} perfiles completados
            </span>
          </div>

          <div className={styles.contribuidores}>
            {teamMembers.map((member, idx) => (
              <article key={member.id} className={styles.contribuidor}>
                <div className={`${styles.contribuidorArchivo} ${styles.meta}`}>
                  <span>integrante-{String(idx + 1).padStart(2, "0")}.json</span>
                  <span>{member.roleTitle || "Desarrollador"}</span>
                </div>

                <div className={styles.contribuidorRetratoWrap}>
                  {member.photoPublicId ? (
                    <Image
                      src={buildCloudinaryFillUrl(member.photoPublicId, 300, 300)}
                      alt={member.photoAltText || member.fullName}
                      width={96}
                      height={96}
                      className={styles.contribuidorRetrato}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.contribuidorRetratoPendiente}>
                      {member.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className={styles.contribuidorIdentidad}>
                  <h3>{member.fullName}</h3>
                  <p>{member.roleTitle || "Colaborador"}</p>
                </div>

                {member.githubUrl && member.githubUrl.startsWith("https://") ? (
                  <a
                    href={member.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.contribuidorLink}
                    aria-label={`GitHub de ${member.fullName}`}
                  >
                    <IconoGitHub />
                    <span>{member.githubUrl.replace("https://github.com/", "@")}</span>
                  </a>
                ) : (
                  <span className={`${styles.contribuidorPendiente} ${styles.meta}`}>
                    Sin enlace público
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* ── CIERRE EDITORIAL ─────────────────────────────────────── */}
        <section className={`${styles.contenedor} ${styles.seccion} ${styles.nosotrosCierre}`}>
          <p>
            El resultado importa.<br />
            El proceso también.
          </p>
          <Link prefetch={false} className={`${styles.boton} ${styles.botonPrimario}`} href="/blogs">
            <span>Explorar las entregas</span> <IconoFlecha />
          </Link>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
