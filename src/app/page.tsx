import { getPublicSiteProfile, getPublicSection, getPublicTeamMembers } from "@/server/site/public-site-service";
import { listPublishedCategoryStats, listRecentPublishedBlogs } from "@/server/blogs/public-blog-service";
import { getDeliveryUrl } from "@/server/media/cloudinary";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import Link from "next/link";
import { Metadata } from "next";
import styles from "./home.module.css";
import {
  IconoCheck,
  IconoFlecha,
  IconoTerminal,
  IconoRama,
  EtiquetaTipo,
  VentanaEvidencia,
  FilaArchivo,
} from "@/components/site/devbox-pieces";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicSiteProfile();
  return {
    title: profile?.groupName ? `${profile.groupName} | Inicio` : "DevNova | Inicio",
    description: profile?.tagline || "Ideas que compilan, proyectos que evolucionan.",
  };
}

export default async function HomePage() {
  const [profile, homeSection, publishedBlogs, teamMembers, categoryStats] = await Promise.all([
    getPublicSiteProfile(),
    getPublicSection("HOME"),
    listRecentPublishedBlogs(10),
    getPublicTeamMembers(),
    listPublishedCategoryStats(),
  ]);

  const brandName = profile?.groupName || "DevNova";
  const tagline = profile?.tagline || "Ideas que compilan, proyectos que evolucionan.";
  const description =
    "Repositorio académico de proyectos, talleres y deberes. Cada archivo reúne el proceso, la fecha de publicación y la evidencia del equipo completo.";

  const featuredBlog = publishedBlogs[0] ?? null;
  const recentBlogs = publishedBlogs.slice(1, 5);

  const featuredCoverUrl = featuredBlog?.coverMediaAssetId
    ? getDeliveryUrl(featuredBlog.coverMediaAssetId, 1200)
    : null;

  const displayDate = featuredBlog
    ? new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(featuredBlog.publishedAt))
    : new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());

  const teamCountText = `${teamMembers.length || 6} integrantes`;
  const getCategory = (slug: string) => categoryStats.categories.find((category) => category.slug === slug);
  const proyecto = getCategory("proyecto");
  const taller = getCategory("taller");
  const deber = getCategory("deber");

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main>
        {/* ── 1. HERO DESTRUCTOR / MONUMENTAL ──────────────────────── */}
        <section className={`${styles.heroDevnova} ${styles.contenedor}`} aria-labelledby="titulo-devnova">
          <h1 id="titulo-devnova" className={styles.heroDevnovaTitulo}>
            {brandName}
          </h1>

          <div className={styles.heroDevnovaEscena}>
            {/* Terminal Izquierda */}
            <div className={styles.heroTerminal} aria-label="Resumen del repositorio">
              <div className={styles.heroTerminalBarra}>
                <span />
                <span>overview.sh</span>
                <IconoTerminal />
              </div>
              <p>
                <span>$</span> devnova --status
              </p>
              <p>
                <b>{categoryStats.total}</b> archivos indexados
              </p>
              <p>
                <b>{proyecto?.publishedCount || 0}</b> proyectos · <b>{taller?.publishedCount || 0}</b> talleres · <b>{deber?.publishedCount || 0}</b> deberes
              </p>
              <p className={styles.heroTerminalOk}>
                <IconoCheck /> contenido versionado
              </p>
            </div>

            {/* Carpeta Azul Central */}
            <div className={styles.repoFolder}>
              <div className={styles.repoFolderPestanas} aria-hidden="true">
                <span>planificar</span>
                <span>construir</span>
                <span>verificar</span>
              </div>
              <div className={styles.repoFolderCuerpo}>
                {featuredBlog ? (
                  <>
                    <div className={`${styles.repoFolderRuta} ${styles.meta}`}>
                      devnova / {featuredBlog.slug}.md
                    </div>
                    <div className={styles.repoFolderContenido}>
                      <div>
                        <div className={styles.repoFolderTag}>
                          <IconoRama /> Repositorio académico
                        </div>
                        <h2>{featuredBlog.title}</h2>
                        <p>{featuredBlog.summary}</p>
                      </div>
                      <div className={styles.repoFolderAcciones}>
                        <Link prefetch={false} className={`${styles.boton} ${styles.botonPapel}`} href={`/blogs/${featuredBlog.slug}`}>
                          <span>Abrir archivo</span> <IconoFlecha />
                        </Link>
                        <Link prefetch={false} className={styles.enlaceTecnico} href="/blogs">
                          Explorar todo el repositorio
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.repoFolderVacio}>
                    <div className={`${styles.repoFolderRuta} ${styles.meta}`}>
                      devnova / desarrollo-asistido-por-software.md
                    </div>
                    <div className={styles.repoFolderContenido}>
                      <div>
                        <div className={styles.repoFolderTag}>
                          <IconoRama /> Repositorio académico
                        </div>
                        <h2>
                          Desarrollo<br />asistido<br />por Software
                        </h2>
                        <p>
                          Documentamos métodos, herramientas y decisiones que apoyan el análisis, diseño, construcción, prueba y evolución del software.
                        </p>
                      </div>
                      <div className={styles.repoFolderAcciones}>
                        <Link prefetch={false} className={`${styles.boton} ${styles.botonPapel}`} href="/blogs">
                          <span>Explorar entregas</span> <IconoFlecha />
                        </Link>
                        <Link prefetch={false} className={styles.enlaceTecnico} href="/nosotros">
                          Conocer al equipo
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ficha de Estado Derecha ("Última Publicación") */}
            <aside className={styles.heroEstado} aria-label="Estado de la entrega destacada">
              <div className={styles.heroEstadoCabecera}>
                <span>Última Publicación</span>
                <span className={styles.heroEstadoSenal} aria-hidden="true" />
              </div>
              <p className={styles.heroEstadoFecha}>
                {displayDate}
              </p>
              <dl className={styles.heroEstadoDl}>
                <div>
                  <dt>Archivo</dt>
                  <dd>01</dd>
                </div>
                <div>
                  <dt>Equipo</dt>
                  <dd>{teamCountText}</dd>
                </div>
              </dl>
            </aside>
          </div>

          <div className={styles.heroDevnovaPie}>
            <p className={styles.heroDevnovaLema}>
              {tagline.includes(",") ? (
                <>
                  {tagline.split(",")[0]},<br />
                  {tagline.split(",")[1]}
                </>
              ) : (
                tagline
              )}
            </p>
            <p className={styles.heroDevnovaDescripcion}>{description}</p>
          </div>
        </section>

        {/* ── 2. SECCIÓN AZUL CON EVIDENCIA ────────────────────────── */}
        <section className={styles.seccionAzul}>
          <div className={`${styles.contenedor} ${styles.destacadaEditorial}`}>
            <div className={styles.destacadaEditorialTexto}>
              <h2>
                Del problema al<br />software verificable.
              </h2>
              <p className={`${styles.meta} ${styles.destacadaEditorialArchivo}`}>
                Desarrollo asistido por software
              </p>
              <p>
                {homeSection?.contentMarkdown ||
                  "DevNova reúne cómo analizamos, diseñamos, construimos y comprobamos soluciones con apoyo de herramientas técnicas. Cada publicación transforma decisiones, código y resultados en evidencia consultable."}
              </p>
              <div className={styles.acciones}>
                <Link prefetch={false} className={`${styles.boton} ${styles.botonCarbon}`} href="/blogs">
                  <span>Explorar entregas</span> <IconoFlecha />
                </Link>
                <Link prefetch={false} className={`${styles.boton} ${styles.botonLineaClara}`} href="/nosotros">
                  <span>Conocer al equipo</span> <IconoFlecha />
                </Link>
              </div>
            </div>
            <div className={styles.destacadaEditorialMedia}>
              <VentanaEvidencia
                imageUrl={featuredCoverUrl}
                alt={featuredBlog?.title || "Evidencia"}
                title={featuredBlog ? `${featuredBlog.slug}.png` : "flujo-devnova.png"}
                tag="desarrollo asistido"
                caption={featuredBlog?.title ? `Evidencia: ${featuredBlog.title}` : "Proceso general de aprendizaje y desarrollo en DevNova"}
              />
            </div>
          </div>
        </section>

        {/* ── 3. TRES FORMAS DE CONSTRUIR (COLECCIONES) ────────────── */}
        <section className={`${styles.contenedor} ${styles.seccion} ${styles.colecciones}`} aria-labelledby="titulo-colecciones">
          <div className={styles.seccionCabecera}>
            <h2 id="titulo-colecciones">Tres formas de construir.</h2>
            <p>Proyectos que evolucionan, talleres que prueban y deberes que documentan lo aprendido.</p>
          </div>
          <div className={styles.coleccionesPestanas}>
            <Link prefetch={false} href="/blogs?category=proyecto" className={`${styles.coleccion} ${styles.coleccionProyecto}`}>
              <span className={`${styles.coleccionCuenta} ${styles.meta}`}>
                {String(proyecto?.publishedCount || 0).padStart(2, "0")} archivos
              </span>
              <EtiquetaTipo tipo="proyecto" label={proyecto?.name || "Proyecto"} />
              <h3>{proyecto?.name || "Proyectos"}</h3>
              <p>Sistemas construidos por etapas y entregas de mayor alcance.</p>
              <span className={styles.coleccionAccion}>
                Abrir carpeta <IconoFlecha />
              </span>
            </Link>

            <Link prefetch={false} href="/blogs?category=taller" className={`${styles.coleccion} ${styles.coleccionTaller}`}>
              <span className={`${styles.coleccionCuenta} ${styles.meta}`}>
                {String(taller?.publishedCount || 0).padStart(2, "0")} archivos
              </span>
              <EtiquetaTipo tipo="taller" label={taller?.name || "Taller"} />
              <h3>{taller?.name || "Talleres"}</h3>
              <p>Práctica guiada, herramientas y experimentos verificables.</p>
              <span className={styles.coleccionAccion}>
                Abrir carpeta <IconoFlecha />
              </span>
            </Link>

            <Link prefetch={false} href="/blogs?category=deber" className={`${styles.coleccion} ${styles.coleccionDeber}`}>
              <span className={`${styles.coleccionCuenta} ${styles.meta}`}>
                {String(deber?.publishedCount || 0).padStart(2, "0")} archivos
              </span>
              <EtiquetaTipo tipo="deber" label={deber?.name || "Deber"} />
              <h3>{deber?.name || "Deberes"}</h3>
              <p>Análisis, decisiones y fundamentos documentados.</p>
              <span className={styles.coleccionAccion}>
                Abrir carpeta <IconoFlecha />
              </span>
            </Link>
          </div>
        </section>

        {/* ── 4. ACTIVIDAD RECIENTE (LISTA ARCHIVOS) ───────────────── */}
        {recentBlogs.length > 0 && (
          <section className={`${styles.contenedor} ${styles.seccion} ${styles.archivosRecientes}`} aria-labelledby="titulo-recientes">
            <div className={`${styles.seccionCabecera} ${styles.seccionCabeceraFila}`}>
              <h2 id="titulo-recientes">Actividad reciente</h2>
              <Link prefetch={false} className={styles.enlaceEditorial} href="/blogs">
                <span>Ver todas las entregas</span> <IconoFlecha />
              </Link>
            </div>
            <div className={styles.listaArchivos}>
              {recentBlogs.map((blog, idx) => (
                <FilaArchivo
                  key={blog.slug}
                  slug={blog.slug}
                  title={blog.title}
                  summary={blog.summary}
                  author={blog.creatorName || "DevNova"}
                  date={blog.publishedAt}
                  indexNumber={idx + 1}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 5. CTA EQUIPO ────────────────────────────────────────── */}
        <section className={`${styles.contenedor} ${styles.seccion} ${styles.equipoCta}`}>
          <div className={styles.equipoCtaTerminal}>
            <span className={styles.meta}>contributors.json</span>
            <p>
              <span>{teamMembers.length || "—"}</span>{" "}
              {teamMembers.length === 1 ? "persona" : "personas"},<br />
              un repositorio común.
            </p>
          </div>
          <div className={styles.equipoCtaTexto}>
            <h2>Aprender también es dejar rastro.</h2>
            <p>
              Todo el equipo participa en cada entrada; las decisiones y la evidencia quedan reunidas en un mismo archivo.
            </p>
            <Link prefetch={false} className={`${styles.boton} ${styles.botonPrimario}`} href="/nosotros">
              <span>Conocer al equipo</span> <IconoFlecha />
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
