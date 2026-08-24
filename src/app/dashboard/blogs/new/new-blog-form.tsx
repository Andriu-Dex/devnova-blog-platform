"use client";

import { useActionState, useRef, useState } from "react";
import { createBlogAction } from "../actions";
import styles from "../blogs.module.css";
import Link from "next/link";
import { MediaPicker, MediaItem } from "@/components/media/media-picker";
import Image from "next/image";

export function NewBlogForm({ mediaList }: { mediaList: MediaItem[] }) {
  const [state, formAction, isPending] = useActionState(createBlogAction, null);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [coverAltText, setCoverAltText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    // Focus back on textarea
    textarea.focus();
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title} style={{ marginBottom: "24px" }}>Crear nuevo blog</h2>
      
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
          />
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
          />
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
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
