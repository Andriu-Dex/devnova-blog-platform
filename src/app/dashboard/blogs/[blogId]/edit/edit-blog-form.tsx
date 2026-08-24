"use client";

import { useActionState, useRef, useState } from "react";
import { editBlogAction } from "../../actions";
import styles from "../../blogs.module.css";
import Link from "next/link";
import { MediaPicker, MediaItem } from "@/components/media/media-picker";
import Image from "next/image";

interface EditBlogFormProps {
  blog: {
    id: string;
    slug: string;
    creatorName: string;
  };
  latestVersion: {
    id: string;
    versionNumber: number;
    title: string;
    summary: string;
    contentMarkdown: string;
    coverMediaAssetId: string | null;
    coverAltText: string | null;
    editorName: string;
    createdAt: Date;
  };
  mediaList: MediaItem[];
}

export function EditBlogForm({ blog, latestVersion, mediaList }: EditBlogFormProps) {
  const [state, formAction, isPending] = useActionState(editBlogAction, null);
  
  const [coverMediaId, setCoverMediaId] = useState<string | null>(latestVersion.coverMediaAssetId);
  const [coverAltText, setCoverAltText] = useState<string>(latestVersion.coverAltText || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedCover = coverMediaId ? mediaList.find(m => m.id === coverMediaId) : null;
  const isArchivedCover = coverMediaId && !selectedCover;

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
    textarea.focus();
  };

  return (
    <div className={styles.formContainer}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <h2 className={styles.title}>Editar versión</h2>
        <Link href="/dashboard/blogs" className={styles.actionButton}>
          ← Volver al listado
        </Link>
      </div>

      <div className={styles.metadataPanel}>
        <div className={styles.metadataItem}>
          <strong>Slug:</strong> /{blog.slug}
        </div>
        <div className={styles.metadataItem}>
          <strong>Versión actual:</strong> v{latestVersion.versionNumber}
        </div>
        <div className={styles.metadataItem}>
          <strong>Creador original:</strong> {blog.creatorName}
        </div>
        <div className={styles.metadataItem}>
          <strong>Última edición por:</strong> {latestVersion.editorName} ({latestVersion.createdAt.toLocaleString()})
        </div>
      </div>
      
      <form action={formAction}>
        <input type="hidden" name="blogId" value={blog.id} />
        <input type="hidden" name="baseVersionId" value={latestVersion.id} />
        
        {coverMediaId && <input type="hidden" name="coverMediaAssetId" value={coverMediaId} />}
        {coverAltText && <input type="hidden" name="coverAltText" value={coverAltText} />}

        {state?.error && (
          <div className={styles.errorMessage} role="alert">
            {state.error}
          </div>
        )}
        
        {state?.success && (
          <div className={styles.successMessage} role="alert">
            {state.success}
          </div>
        )}

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
          ) : isArchivedCover ? (
             <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginTop: "12px", border: "1px solid #f8c2b7", backgroundColor: "#fce8e6", padding: "12px", borderRadius: "8px" }}>
               <div style={{ flex: 1 }}>
                 <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#d93025" }}>Portada archivada</div>
                 <div style={{ fontSize: "0.85rem", color: "#51545a", marginTop: "4px" }}>La portada actual ha sido archivada. Si guardas una nueva versión con esta portada, será rechazada. Por favor elimínala o selecciona otra.</div>
                 <button type="button" onClick={() => { setCoverMediaId(null); setCoverAltText(""); }} style={{ marginTop: "8px", color: "#d93025", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", padding: 0, textDecoration: "underline", fontWeight: "bold" }}>
                   Remover portada archivada
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
            defaultValue={latestVersion.title}
            className={styles.input}
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
            defaultValue={latestVersion.summary}
            className={styles.input}
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
            defaultValue={latestVersion.contentMarkdown}
            className={styles.textarea}
            style={{ minHeight: "300px" }}
          />
        </div>

        <div className={styles.formGroup} style={{ marginTop: "16px", backgroundColor: "#f0fdf4", padding: "16px", borderRadius: "10px", border: "1px solid #039855" }}>
          <label htmlFor="changeSummary" className={styles.label} style={{ color: "#039855" }}>Resumen del cambio (Para auditoría de esta versión) *</label>
          <input
            id="changeSummary"
            name="changeSummary"
            type="text"
            required
            maxLength={500}
            className={styles.input}
            style={{ backgroundColor: "#ffffff" }}
            placeholder="Ej: Corrección de introducción"
          />
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
          <button type="submit" disabled={isPending} className={styles.submitButton} style={{ marginTop: 0 }}>
            {isPending ? "Guardando versión..." : "Guardar nueva versión"}
          </button>
        </div>
      </form>
    </div>
  );
}
