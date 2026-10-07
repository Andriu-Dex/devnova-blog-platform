"use client";

import React from "react";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import { getDeliveryUrlClient } from "@/lib/cloudinary-client";
import styles from "@/app/blogs/[slug]/slug.module.css";
import {
  EtiquetaTipo,
  EstadoEntrega,
  IconoTerminal,
} from "@/components/site/devbox-pieces";
import Image from "next/image";

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
  hideHero?: boolean;
  isEditorPreview?: boolean;
}

export function BlogPreviewClient({
  blog,
  mediaMap,
  hideHero = false,
  isEditorPreview = true,
}: BlogPreviewClientProps) {
  const coverUrl = blog.coverMediaAssetId ? getDeliveryUrlClient(blog.coverMediaAssetId, 1200) : null;
  const slug = blog.slug || "borrador";
  
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(blog.publishedAt || new Date());

  return (
    <div className={`${styles.page} ${isEditorPreview ? styles.editorPreviewPage : ""}`} style={{ backgroundColor: "#faf9f6" }}>
      <main>
        {/* ── 1. SECCIÓN AZUL HERO (siempre arriba, con o sin imagen) ── */}
        {!hideHero && (
          <section className={`${styles.seccionAzul} ${isEditorPreview ? styles.editorPreviewHero : ""}`} aria-label="Cabecera del blog">
            <div className={`${styles.contenedor} ${styles.entradaHeroGrid} ${isEditorPreview ? styles.editorPreviewHeroGrid : ""}`}>
              {/* Texto */}
              <div className={styles.entradaHeroTexto}>
                {/* Breadcrumb */}
                <nav className={`${styles.breadcrumb} ${isEditorPreview ? styles.editorPreviewBreadcrumb : ""}`} aria-label="Ruta de navegación">
                  <Link href="#" onClick={(e) => e.preventDefault()}>devnova</Link>
                  <span>/</span>
                  <Link href="#" onClick={(e) => e.preventDefault()}>blogs</Link>
                  <span>/</span>
                  <span className={styles.breadcrumbActive}>{slug}.md</span>
                </nav>

                <div className={styles.entradaHeroEtiquetas}>
                  <EtiquetaTipo tipo={blog.categoryColorClass || blog.categorySlug || "blog"} label={blog.categoryName || "Sin categoría"} />
                  <EstadoEntrega estado="entregado" />
                </div>
                <h1>{blog.title || "Título del blog"}</h1>
                <p className={styles.entradaHeroResumen}>{blog.summary || "Escribe un resumen para ver cómo luce aquí."}</p>
              </div>

              {/* Media */}
              <div className={`${styles.entradaHeroMedia} ${isEditorPreview ? styles.editorPreviewMedia : ""}`}>
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
        )}

        {/* ── 2. LECTURA EDITORIAL (PROSA) ── */}
        <section className={`${styles.contenedor} ${styles.entradaLectura} ${isEditorPreview ? styles.editorPreviewLectura : ""}`}>
          <div className={`${styles.entradaLecturaRuta} ${isEditorPreview ? styles.editorPreviewLecturaRuta : ""}`}>
            <span className={styles.meta}>devnova / contenido / lectura</span>
          </div>

          <div className={`${styles.entradaLecturaCuerpo} ${isEditorPreview ? styles.editorPreviewLecturaCuerpo : ""}`}>
            <div className={`${styles.prosa} ${isEditorPreview ? styles.editorPreviewProsa : ""}`}>
              <MarkdownRenderer content={blog.contentMarkdown || "*El contenido de tu blog aparecerá aquí.*"} mediaMap={mediaMap} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
