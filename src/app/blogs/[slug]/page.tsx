import { getPublishedBlogBySlug, listRelatedPublishedBlogs } from "@/server/blogs/public-blog-service";
import { getDeliveryUrl } from "@/server/media/cloudinary";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import styles from "./slug.module.css";
import {
  IconoCalendario,
  IconoArchivo,
  EtiquetaTipo,
  EstadoEntrega,
  VentanaEvidencia,
} from "@/components/site/devbox-pieces";

export const dynamic = "force-dynamic";

const getBlogData = cache(async (slug: string) => {
  return await getPublishedBlogBySlug(slug);
});

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBlogData(slug);

  if (!result) return { title: "No encontrado" };

  const { blog } = result;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const images = blog.coverMediaAssetId ? [getDeliveryUrl(blog.coverMediaAssetId, 1200)] : [];

  return {
    title: `${blog.title} | DevNova`,
    description: blog.summary,
    alternates: {
      canonical: siteUrl ? `${siteUrl}/blogs/${blog.slug}` : `/blogs/${blog.slug}`,
    },
    openGraph: {
      title: blog.title,
      description: blog.summary,
      url: siteUrl ? `${siteUrl}/blogs/${blog.slug}` : `/blogs/${blog.slug}`,
      type: "article",
      publishedTime: blog.publishedAt.toISOString(),
      authors: [blog.creatorName],
      images,
    },
    twitter: { card: "summary_large_image", title: blog.title, description: blog.summary, images },
  };
}

export default async function PublicBlogDetail({ params }: Props) {
  const { slug } = await params;
  const result = await getBlogData(slug);

  if (!result) notFound();

  const { blog, mediaMap } = result;
  const coverUrl = blog.coverMediaAssetId ? getDeliveryUrl(blog.coverMediaAssetId, 1200) : null;
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(blog.publishedAt));

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main>
        {/* ── 1. HERO DE DETALLE ───────────────────────────────────── */}
        <section className={`${styles.contenedor} ${styles.entradaHero}`}>
          <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
            <Link href="/">devnova</Link>
            <span>/</span>
            <Link href="/blogs">entregas</Link>
            <span>/</span>
            <span className={styles.breadcrumbActive}>{blog.slug}.md</span>
          </nav>

          <div className={styles.entradaHeroGrid}>
            <div>
              <div className={styles.entradaHeroEtiquetas}>
                <EtiquetaTipo tipo="deber" />
                <EstadoEntrega estado="entregado" />
              </div>
              <h1>{blog.title}</h1>
              <p className={styles.entradaHeroResumen}>{blog.summary}</p>
            </div>

            {/* Ficha técnica lateral */}
            <aside className={styles.entradaFicha} aria-label="Ficha técnica del documento">
              <div className={styles.entradaFichaCabecera}>
                <span className={styles.meta}>Ficha técnica</span>
                <span className={styles.meta}>docs/{blog.slug}.md</span>
              </div>
              <dl>
                <div>
                  <dt>
                    <IconoArchivo /> Autor
                  </dt>
                  <dd>{blog.creatorName}</dd>
                </div>
                <div>
                  <dt>
                    <IconoCalendario /> Publicado
                  </dt>
                  <dd>{formattedDate}</dd>
                </div>
                <div>
                  <dt>
                    <IconoArchivo /> Formato
                  </dt>
                  <dd>Markdown (v1)</dd>
                </div>
                <div>
                  <dt>
                    <IconoArchivo /> Estado
                  </dt>
                  <dd>Publicado</dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        {/* ── 2. SECCIÓN AZUL DE EVIDENCIA (SI HAY IMAGEN DE PORTADA) ── */}
        {coverUrl && (
          <section className={styles.seccionAzul} aria-label="Evidencia de la entrega">
            <div className={`${styles.contenedor} ${styles.entradaEvidenciaGrid}`}>
              <div className={styles.entradaEvidenciaDatos}>
                <h2>
                  El trabajo habla<br />con evidencia.
                </h2>
                <p className={`${styles.meta} ${styles.entradaEvidenciaRuta}`}>
                  devnova / {blog.slug}.png
                </p>
                <p>{blog.summary}</p>
              </div>
              <div className={styles.entradaEvidenciaMedia}>
                <VentanaEvidencia
                  imageUrl={coverUrl}
                  alt={blog.coverAltText || blog.title}
                  title={`${blog.slug}.png`}
                  tag="evidencia"
                  caption={`Captura aportada para ${blog.title}`}
                />
              </div>
            </div>
          </section>
        )}

        {/* ── 3. LECTURA EDITORIAL (PROSA) ─────────────────────────── */}
        <section className={`${styles.contenedor} ${styles.entradaLectura}`}>
          <div className={styles.entradaLecturaRuta}>
            <span className={styles.meta}>devnova / contenido / lectura</span>
          </div>

          <div className={styles.entradaLecturaCuerpo}>
            <div className={styles.prosa}>
              <MarkdownRenderer content={blog.contentMarkdown} mediaMap={mediaMap} />
            </div>
          </div>
        </section>

        {/* ── 4. ARTÍCULOS RELACIONADOS ────────────────────────────── */}
        <RelatedBlogs currentBlogId={blog.id} />
      </main>

      <PublicFooter />
    </div>
  );
}

async function RelatedBlogs({ currentBlogId }: { currentBlogId: string }) {
  const related = await listRelatedPublishedBlogs({ excludeBlogId: currentBlogId, limit: 2 });

  if (related.length === 0) return null;

  return (
    <section className={`${styles.contenedor} ${styles.entradaVecinos}`} aria-label="Entregas relacionadas">
      {related.map((item, idx) => (
        <Link key={item.slug} href={`/blogs/${item.slug}`} className={idx === 1 ? styles.entradaVecinoSiguiente : ""}>
          <span className={styles.meta}>
            {idx === 0 ? "← Entrega anterior" : "Siguiente entrega →"}
          </span>
          <strong>{item.title}</strong>
          <span className={styles.meta}>Abrir archivo</span>
        </Link>
      ))}
    </section>
  );
}
