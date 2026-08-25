"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { createBlogAction } from "../actions";
import styles from "../blogs.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MediaPicker, MediaItem } from "@/components/media/media-picker";
import Image from "next/image";
import { useLocalBlogDraft } from "@/components/blogs/hooks/use-local-blog-draft";
import { ImportMarkdownButton } from "@/components/blogs/import-markdown-button";
import type { BlogCategoryItem } from "@/server/blogs/category-service";

export function NewBlogForm({ mediaList, categories }: { mediaList: MediaItem[]; categories: BlogCategoryItem[] }) {
  const [state, formAction, isPending] = useActionState(createBlogAction, null);
  
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [coverAltText, setCoverAltText] = useState<string>("");
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentData = {
    title,
    slug,
    summary,
    categoryId: categoryId || null,
    contentMarkdown,
    coverMediaAssetId: coverMediaId,
    coverAltText,
  };

  const draftKey = "devnova:blog-draft:new";
  const draftProps = useLocalBlogDraft({ draftKey, currentData });
  const router = useRouter();

  // Listen to state changes to clear draft if success
  useEffect(() => {
    if (state?.success && state?.blogId) {
      draftProps.clearDraftOnSuccess();
      router.push(`/dashboard/blogs/${state.blogId}/edit`);
    }
  }, [state, draftProps, router]);

  const selectedCover = coverMediaId ? mediaList.find(m => m.id === coverMediaId) : null;

  const insertIntoMarkdown = (mediaId: string, altText: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const insertText = `![${altText}](media://${mediaId})`;
    
    textarea.setRangeText(
      insertText,
      textarea.selectionStart,
      textarea.selectionEnd,
      "end"
    );
    setContentMarkdown(textarea.value);
    textarea.focus();
  };

  const restoreDraft = () => {
    if (draftProps.draftData) {
      setTitle(draftProps.draftData.title || "");
      setSlug(draftProps.draftData.slug || "");
      setSummary(draftProps.draftData.summary || "");
      setCategoryId(draftProps.draftData.categoryId || "");
      setContentMarkdown(draftProps.draftData.contentMarkdown || "");
      setCoverMediaId(draftProps.draftData.coverMediaAssetId || null);
      setCoverAltText(draftProps.draftData.coverAltText || "");
    }
  };

  const handleImport = (data: { title?: string, summary?: string, contentMarkdown: string }) => {
    if (data.title) setTitle(data.title);
    if (data.summary) setSummary(data.summary);
    setContentMarkdown(data.contentMarkdown);
  };

  return (
    <div className={styles.formContainer}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 className={styles.title} style={{ marginBottom: 0 }}>Crear nuevo blog</h2>
        
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <ImportMarkdownButton 
            onImport={handleImport} 
            hasExistingContent={Boolean(title || summary || contentMarkdown)} 
          />
          {draftProps.saveStatus !== "idle" && (
            <div style={{ fontSize: "0.85rem", color: "#6b7280", fontFamily: "var(--font-mono)" }} aria-live="polite">
              {draftProps.saveStatus === "saving" ? "Guardando..." : 
               draftProps.lastSavedAt ? `Guardado localmente a las ${new Date(draftProps.lastSavedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Guardado localmente"}
            </div>
          )}
        </div>
      </div>
      
      {draftProps.hasDraft && (
        <div style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", padding: "16px", borderRadius: "8px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }} role="status">
          <div>
            <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "#0369a1", fontSize: "0.95rem" }}>Encontramos un borrador local sin guardar.</p>
            <p style={{ margin: 0, color: "#0ea5e9", fontSize: "0.85rem" }}>Puedes restaurarlo o descartarlo para empezar de cero.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button type="button" onClick={draftProps.discardDraft} style={{ background: "none", border: "none", color: "#0369a1", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}>Descartar</button>
            <button type="button" onClick={restoreDraft} style={{ backgroundColor: "#0284c7", color: "white", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "0.85rem", cursor: "pointer", fontWeight: 600 }}>Restaurar borrador</button>
          </div>
        </div>
      )}

      <form action={formAction}>
        {state?.error && (
          <div className={styles.errorMessage} role="alert">
            {state.error}
          </div>
        )}

        {coverMediaId && <input type="hidden" name="coverMediaAssetId" value={coverMediaId} />}
        {coverAltText && <input type="hidden" name="coverAltText" value={coverAltText} />}

        <div className={styles.formGroup} style={{ backgroundColor: "#f9fafb", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <label className={styles.label}>Portada del Blog (Opcional)</label>
          
          {selectedCover ? (
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginTop: "12px" }}>
              <div style={{ position: "relative", width: "120px", height: "80px", backgroundColor: "#f1f2f4", borderRadius: "6px", overflow: "hidden" }}>
                <Image src={selectedCover.thumbnailUrl} alt={coverAltText} fill style={{ objectFit: "cover" }} unoptimized />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{selectedCover.originalFilename}</div>
                <div style={{ fontSize: "0.85rem", color: "#51545a", marginTop: "4px" }}>Texto alternativo: {coverAltText}</div>
                <button type="button" onClick={() => { setCoverMediaId(null); setCoverAltText(""); }} style={{ marginTop: "8px", color: "#d93025", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: 0, textDecoration: "underline" }}>
                  Eliminar portada
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: "8px" }}>
              <MediaPicker 
                mediaList={mediaList} 
                requireAltText={true} 
                buttonLabel="Seleccionar portada" 
                onSelect={(id, alt) => {
                  setCoverMediaId(id);
                  setCoverAltText(alt);
                }} 
              />
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>Título *</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={200}
            className={styles.input}
            placeholder="Título del blog"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="slug" className={styles.label}>Slug (URL amigable)</label>
          <input
            id="slug"
            name="slug"
            type="text"
            maxLength={180}
            className={styles.input}
            placeholder="Opcional. Si lo dejas vacío, se generará a partir del título."
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="summary" className={styles.label}>Resumen *</label>
          <input
            id="summary"
            name="summary"
            type="text"
            required
            maxLength={500}
            className={styles.input}
            placeholder="Breve descripción (máx 500 caracteres)"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="categoryId" className={styles.label}>Categoría</label>
          <select
            id="categoryId"
            name="categoryId"
            className={styles.input}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label htmlFor="contentMarkdown" className={styles.label} style={{ marginBottom: 0 }}>Contenido (Markdown) *</label>
            <MediaPicker 
              mediaList={mediaList} 
              requireAltText={true} 
              buttonLabel="Insertar imagen" 
              onSelect={insertIntoMarkdown} 
            />
          </div>
          <textarea
            id="contentMarkdown"
            name="contentMarkdown"
            ref={textareaRef}
            required
            className={styles.textarea}
            placeholder="# Título Principal&#10;&#10;Escribe tu contenido aquí usando Markdown..."
            style={{ minHeight: "300px" }}
            value={contentMarkdown}
            onChange={(e) => setContentMarkdown(e.target.value)}
          />
        </div>
        
        <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "16px", marginBottom: 0 }}>
          Los cambios se guardan temporalmente en este navegador. Usa &quot;Crear Blog&quot; para registrarlos en DevNova.
        </p>

        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <Link
            href="/dashboard/blogs"
            className={styles.actionButton}
            style={{ padding: "14px 20px", display: "inline-flex", alignItems: "center" }}
          >
            Cancelar
          </Link>
          <button type="submit" disabled={isPending} className={styles.submitButton} style={{ marginTop: 0 }}>
            {isPending ? "Guardando..." : "Crear Blog"}
          </button>
        </div>
      </form>
    </div>
  );
}
