"use client";

import React from "react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import { getDeliveryUrlClient } from "@/lib/cloudinary-client";
import styles from "@/app/blogs/[slug]/slug.module.css";
import {
  IconoCalendario,
  IconoArchivo,
  EtiquetaTipo,
  EstadoEntrega,
  VentanaEvidencia,
} from "@/components/site/devbox-pieces";

interface BlogPreviewClientProps {
  blog: {
    title: string;
    summary: string;
    slug?: string;
    creatorName?: string;
    publishedAt?: Date;
    categoryName?: string;
    categorySlug?: string;
    categoryColorClass?: string;
    coverMediaAssetId?: string | null;
    coverAltText?: string | null;
    contentMarkdown: string;
  };
  mediaMap?: Map<string, { id: string; publicId: string; width: number; height: number }>;
}

export function BlogPreviewClient({ blog, mediaMap }: BlogPreviewClientProps) {
  const coverUrl = blog.coverMediaAssetId ? getDeliveryUrlClient(blog.coverMediaAssetId, 1200) : null;
  const slug = blog.slug || "borrador";
  
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(blog.publishedAt || new Date());

  return (
    <div className={styles.page} style={{ backgroundColor: "#faf9f6" }}>
      <main>
        {/* ── 1. HERO DE DETALLE ───────────────────────────────────── */}
        <section className={`${styles.contenedor} ${styles.entradaHero}`}>
          <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
            <Link href="#" onClick={(e) => e.preventDefault()}>devnova</Link>
            <span>/</span>
            <Link href="#" onClick={(e) => e.preventDefault()}>entregas</Link>
            <span>/</span>
            <span className={styles.breadcrumbActive}>{slug}.md</span>
          </nav>

          <div className={styles.entradaHeroGrid}>
            <div>
              <div className={styles.entradaHeroEtiquetas}>
                <EtiquetaTipo tipo={blog.categoryColorClass || blog.categorySlug || "blog"} label={blog.categoryName || "Sin categoría"} />
                <EstadoEntrega estado="entregado" />
              </div>
              <h1>{blog.title || "Título del blog"}</h1>
              <p className={styles.entradaHeroResumen}>{blog.summary || "Escribe un resumen para ver cómo luce aquí."}</p>
            </div>

            {/* Ficha técnica lateral */}
            <aside className={styles.entradaFicha} aria-label="Ficha técnica del documento">
              <div className={styles.entradaFichaCabecera}>
                <span className={styles.meta}>Ficha técnica</span>
                <span className={styles.meta}>docs/{slug}.md</span>
              </div>
              <dl>
                <div>
                  <dt>
                    <IconoArchivo /> Autor
                  </dt>
                  <dd>{blog.creatorName || "Autor Anónimo"}</dd>
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
                  <dd>Borrador / Previsualización</dd>
                </div>
                <div>
                  <dt>
                    <IconoArchivo /> Categoría
                  </dt>
                  <dd>{blog.categoryName || "Sin categoría"}</dd>
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
                  devnova / {slug}.png
                </p>
                <p>{blog.summary}</p>
              </div>
              <div className={styles.entradaEvidenciaMedia}>
                <VentanaEvidencia
                  imageUrl={coverUrl}
                  alt={blog.coverAltText || blog.title}
                  title={`${slug}.png`}
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
              <MarkdownRenderer content={blog.contentMarkdown || "*El contenido de tu blog aparecerá aquí.*"} mediaMap={mediaMap} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
