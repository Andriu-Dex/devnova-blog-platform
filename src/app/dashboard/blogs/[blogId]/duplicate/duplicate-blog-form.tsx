"use client";

import { useActionState, useEffect, useState } from "react";
import { duplicateBlogAction } from "../../actions";
import styles from "../../blogs.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DuplicateBlogFormProps {
  sourceBlog: {
    id: string;
    slug: string;
  };
  sourceLatestVersion: {
    title: string;
    summary: string;
    versionNumber: number;
  };
}

export function DuplicateBlogForm({ sourceBlog, sourceLatestVersion }: DuplicateBlogFormProps) {
  const [state, formAction, isPending] = useActionState(duplicateBlogAction, null);
  const router = useRouter();

  const [title, setTitle] = useState(`${sourceLatestVersion.title} — copia`);
  const [slug, setSlug] = useState(`${sourceBlog.slug}-copia`);
  const [summary, setSummary] = useState(sourceLatestVersion.summary);

  useEffect(() => {
    if (state?.success && state?.blogId) {
      router.push(`/dashboard/blogs/${state.blogId}/edit`);
    }
  }, [state, router]);

  return (
    <div className={styles.formContainer}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <h2 className={styles.title} style={{ margin: 0 }}>Duplicar blog</h2>
        <Link href="/dashboard/blogs" className={styles.actionButton}>
          ← Volver al listado
        </Link>
      </div>

      <div className={styles.metadataPanel}>
        <div className={styles.metadataItem}>
          <strong>Blog origen:</strong> /{sourceBlog.slug}
        </div>
        <div className={styles.metadataItem}>
          <strong>Versión a duplicar:</strong> v{sourceLatestVersion.versionNumber}
        </div>
        <p style={{ marginTop: "12px", fontSize: "0.85rem", color: "#4b5563" }}>
          Se creará un blog independiente usando la versión seleccionada como plantilla.
          Las imágenes se mantendrán. La publicación y el historial anterior no se copiarán.
        </p>
      </div>

      <form action={formAction}>
        <input type="hidden" name="sourceBlogId" value={sourceBlog.id} />

        {state?.error && (
          <div className={styles.errorMessage} role="alert">
            {state.error}
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>Título para el nuevo blog *</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="slug" className={styles.label}>Slug para el nuevo blog *</label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            maxLength={180}
            className={styles.input}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="summary" className={styles.label}>Resumen</label>
          <input
            id="summary"
            name="summary"
            type="text"
            maxLength={500}
            className={styles.input}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "32px", alignItems: "center" }}>
          <button type="submit" disabled={isPending} className={styles.submitButton} style={{ marginTop: 0 }}>
            {isPending ? "Duplicando..." : "Confirmar duplicación"}
          </button>
          <Link href="/dashboard/blogs" style={{ padding: "10px 16px", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", color: "#374151", textDecoration: "none", fontWeight: 500 }}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
