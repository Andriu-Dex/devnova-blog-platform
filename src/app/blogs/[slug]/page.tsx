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
import Image from "next/image";
import {
  EtiquetaTipo,
  EstadoEntrega,
  IconoTerminal,
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
  const images = blog.coverMediaPublicId ? [getDeliveryUrl(blog.coverMediaPublicId, 1200)] : [];

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
  const coverUrl = blog.coverMediaPublicId ? getDeliveryUrl(blog.coverMediaPublicId, 1200) : null;
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(blog.publishedAt));

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main>
        {/* ── 1. SECCIÓN AZUL HERO (siempre arriba, con o sin imagen) ── */}
        <section className={styles.seccionAzul} aria-label="Cabecera del blog">
          <div className={`${styles.contenedor} ${styles.entradaHeroGrid}`}>
            {/* Texto */}
            <div className={styles.entradaHeroTexto}>
              {/* Breadcrumb */}
              <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
                <Link href="/">devnova</Link>
                <span>/</span>
                <Link href="/blogs">blogs</Link>
                <span>/</span>
                <span className={styles.breadcrumbActive}>{blog.slug}.md</span>
              </nav>

              <div className={styles.entradaHeroEtiquetas}>
                <EtiquetaTipo tipo={blog.categoryColorClass || blog.categorySlug || "blog"} label={blog.categoryName} />
                <EstadoEntrega estado="entregado" />
              </div>
              <h1>{blog.title}</h1>
              <p className={styles.entradaHeroResumen}>{blog.summary}</p>
            </div>

            {/* Media */}
            <div className={styles.entradaHeroMedia}>
              {coverUrl ? (
                <div className={styles.entradaHeroCover}>
                  <Image
                    src={coverUrl}
                    alt={blog.coverAltText || blog.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 560px"
                    style={{ objectFit: "cover" }}
                    unoptimized
                    priority
                  />
                </div>
              ) : (
                <div className={styles.entradaHeroPlaceholder}>
                  <IconoTerminal />
                  <span>Sin portada</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 2. LECTURA EDITORIAL (PROSA) ─────────────────────────── */}
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

        {/* ── 3. ARTÍCULOS RELACIONADOS ────────────────────────────── */}
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
    <section className={`${styles.contenedor} ${styles.entradaVecinos}`} aria-label="Blogs relacionados">
      {related.map((item, idx) => (
        <Link key={item.slug} href={`/blogs/${item.slug}`} className={idx === 1 ? styles.entradaVecinoSiguiente : ""}>
          <span className={styles.meta}>
            {idx === 0 ? "← Blog anterior" : "Siguiente blog →"}
          </span>
          <strong>{item.title}</strong>
          <span className={styles.meta}>Abrir blog</span>
        </Link>
      ))}
    </section>
  );
}

