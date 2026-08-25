"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { editBlogAction } from "../../actions";
import styles from "../../blogs.module.css";
import Link from "next/link";
import { MediaPicker, MediaItem } from "@/components/media/media-picker";
import Image from "next/image";
import { useLocalBlogDraft } from "@/components/blogs/hooks/use-local-blog-draft";
import { ImportMarkdownButton } from "@/components/blogs/import-markdown-button";
import type { BlogCategoryItem } from "@/server/blogs/category-service";

interface EditBlogFormProps {
  blog: {
    id: string;
    slug: string;
    categoryId: string | null;
    categoryName: string | null;
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
  categories: BlogCategoryItem[];
}

export function EditBlogForm({ blog, latestVersion, mediaList, categories }: EditBlogFormProps) {
  const [state, formAction, isPending] = useActionState(editBlogAction, null);
  
  const [title, setTitle] = useState(latestVersion.title);
  const [summary, setSummary] = useState(latestVersion.summary);
  const [categoryId, setCategoryId] = useState(blog.categoryId || "");
  const [contentMarkdown, setContentMarkdown] = useState(latestVersion.contentMarkdown);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(latestVersion.coverMediaAssetId);
  const [coverAltText, setCoverAltText] = useState<string>(latestVersion.coverAltText || "");
  const [changeSummary, setChangeSummary] = useState("");
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentData = {
    title,
    summary,
    categoryId: categoryId || null,
    contentMarkdown,
    coverMediaAssetId: coverMediaId,
    coverAltText,
    baseVersionId: latestVersion.id, // Para detectar staleness
  };

  const draftKey = `devnova:blog-draft:${blog.id}`;
  const draftProps = useLocalBlogDraft({ draftKey, currentData });

  useEffect(() => {
    if (state?.success) {
      draftProps.clearDraftOnSuccess();
    }
  }, [state, draftProps]);

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
    setContentMarkdown(textarea.value);
    textarea.focus();
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    
    const placeholder = `![Subiendo imagen...]()`;
    textarea.setRangeText(
      placeholder,
      textarea.selectionStart,
      textarea.selectionEnd,
      "end"
    );
    setContentMarkdown(textarea.value);
    
    try {
      const { uploadFileDirectly } = await import("@/components/media/direct-uploader");
      const { mediaAssetId } = await uploadFileDirectly(file);
      
      const newTextareaValue = textarea.value.replace(placeholder, `![${file.name}](media://${mediaAssetId})`);
      setContentMarkdown(newTextareaValue);
      // Wait for React to update the DOM
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.value = newTextareaValue;
        }
      }, 0);
    } catch (err) {
      console.error("Error uploading pasted/dropped image", err);
      const newTextareaValue = textarea.value.replace(placeholder, `![Error al subir imagen]()`);
      setContentMarkdown(newTextareaValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.value = newTextareaValue;
        }
      }, 0);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleFileUpload(file);
          break;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const insertText = `${prefix}${selected}${suffix}`;
    
    textarea.setRangeText(insertText, start, end, "select");
    setContentMarkdown(textarea.value);
    textarea.focus();
  };

  const restoreDraft = () => {
    if (draftProps.draftData) {
      setTitle(draftProps.draftData.title || "");
      setSummary(draftProps.draftData.summary || "");
      setCategoryId(draftProps.draftData.categoryId || "");
      setContentMarkdown(draftProps.draftData.contentMarkdown || "");
      setCoverMediaId(draftProps.draftData.coverMediaAssetId || null);
      setCoverAltText(draftProps.draftData.coverAltText || "");
      setChangeSummary(draftProps.draftData.changeSummary || "");
    }
  };

  const handleImport = (data: { title?: string, summary?: string, contentMarkdown: string }) => {
    if (data.title) setTitle(data.title);
    if (data.summary) setSummary(data.summary);
    setContentMarkdown(data.contentMarkdown);
  };

  const btnStyle = { padding: "4px 8px", fontSize: "0.85rem", border: "1px solid #d1d5db", borderRadius: "4px", backgroundColor: "#f9fafb", cursor: "pointer", color: "#374151" };

  return (
    <div className={styles.formContainer}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <h2 className={styles.title} style={{ marginBottom: 0 }}>Editar blog</h2>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <ImportMarkdownButton 
            onImport={handleImport} 
            hasExistingContent={true} 
          />
          {draftProps.saveStatus !== "idle" && (
            <div style={{ fontSize: "0.85rem", color: "#6b7280", fontFamily: "var(--font-mono)" }} aria-live="polite">
              {draftProps.saveStatus === "saving" ? "Guardando..." : 
               draftProps.lastSavedAt ? `Guardado localmente a las ${new Date(draftProps.lastSavedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Guardado localmente"}
            </div>
          )}
          <Link href="/dashboard/blogs" className={styles.actionButton}>
            ← Volver al listado
          </Link>
        </div>
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
          <strong>Categoría:</strong> {blog.categoryName || "Sin categoría"}
        </div>
        <div className={styles.metadataItem}>
          <strong>Última edición por:</strong> {latestVersion.editorName} ({latestVersion.createdAt.toLocaleString()})
        </div>
      </div>
      
      {draftProps.hasDraft && (
        <div style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", padding: "16px", borderRadius: "8px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }} role="status">
          <div>
            <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "#0369a1", fontSize: "0.95rem" }}>Encontramos un borrador local sin guardar.</p>
            {draftProps.isStale ? (
              <p style={{ margin: 0, color: "#d97706", fontSize: "0.85rem", fontWeight: 500 }}>⚠️ Este borrador local fue creado sobre una versión anterior del blog.</p>
            ) : (
              <p style={{ margin: 0, color: "#0ea5e9", fontSize: "0.85rem" }}>Puedes restaurarlo o descartarlo para seguir con la versión de la base de datos.</p>
            )}
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button type="button" onClick={draftProps.discardDraft} style={{ background: "none", border: "none", color: "#0369a1", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}>Descartar</button>
            <button type="button" onClick={restoreDraft} style={{ backgroundColor: draftProps.isStale ? "#d97706" : "#0284c7", color: "white", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "0.85rem", cursor: "pointer", fontWeight: 600 }}>Restaurar borrador</button>
          </div>
        </div>
      )}
      
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="categoryId" className={styles.label}>Categoría</label>
          <select
            id="categoryId"
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={styles.input}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
            <label htmlFor="contentMarkdown" className={styles.label} style={{ marginBottom: 0 }}>Contenido (Markdown) *</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button type="button" onClick={() => insertFormatting("**")} style={btnStyle}>Bold</button>
              <button type="button" onClick={() => insertFormatting("*")} style={btnStyle}>Italic</button>
              <button type="button" onClick={() => insertFormatting("### ", "")} style={btnStyle}>Heading</button>
              <button type="button" onClick={() => insertFormatting("[", "](url)")} style={btnStyle}>Link</button>
              <button type="button" onClick={() => insertFormatting("`")} style={btnStyle}>Code</button>
              <button type="button" onClick={() => insertFormatting("> ", "")} style={btnStyle}>Quote</button>
              <button type="button" onClick={() => insertFormatting("- ", "")} style={btnStyle}>List</button>
              <MediaPicker 
                mediaList={mediaList} 
                requireAltText={true} 
                buttonLabel="Insertar imagen" 
                onSelect={insertIntoMarkdown} 
              />
            </div>
          </div>
          <textarea
            id="contentMarkdown"
            name="contentMarkdown"
            ref={textareaRef}
            required
            value={contentMarkdown}
            onChange={(e) => setContentMarkdown(e.target.value)}
            className={styles.textarea}
            style={{ minHeight: "300px" }}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
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
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
          />
        </div>
        
        <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "16px", marginBottom: 0 }}>
          Los cambios se guardan temporalmente en este navegador. Usa &quot;Guardar nueva versión&quot; para registrarlos en DevNova.
        </p>

        <div style={{ display: "flex", gap: "12px", marginTop: "16px", alignItems: "center" }}>
          <button type="submit" disabled={isPending} className={styles.submitButton} style={{ marginTop: 0 }}>
            {isPending ? "Guardando versión..." : "Guardar nueva versión"}
          </button>
          <Link href={`/dashboard/blogs/${blog.id}/preview`} style={{ padding: "10px 16px", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", color: "#374151", textDecoration: "none", fontWeight: 500 }} target="_blank">
            Vista Previa
          </Link>
        </div>
      </form>
    </div>
  );
}
