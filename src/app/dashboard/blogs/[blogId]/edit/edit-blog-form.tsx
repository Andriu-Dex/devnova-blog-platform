"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { editBlogAction, editAndPublishBlogAction } from "../../actions";
import styles from "../../blogs.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MediaPicker, MediaItem } from "@/components/media/media-picker";
import Image from "next/image";
import { useLocalBlogDraft } from "@/components/blogs/hooks/use-local-blog-draft";
import { ImportMarkdownButton } from "@/components/blogs/import-markdown-button";
import type { BlogCategoryItem } from "@/server/blogs/category-service";
import { BlogPreviewClient } from "@/components/blogs/blog-preview-client";
import { ResizableSplitView, SplitViewMode } from "@/components/ui/resizable-split-view";

type BlogDto = {
  id: string;
  slug: string;
  creatorName?: string | null;
};

type VersionDto = {
  id: string;
  blogId?: string;
  versionNumber: number;
  title: string;
  summary: string;
  contentMarkdown: string;
  createdAt: Date;
  categoryId?: string | null;
  coverMediaAssetId?: string | null;
  coverAltText?: string | null;
  changeSummary?: string | null;
};

export function EditBlogForm({ 
  blog, 
  latestVersion,
  mediaList,
  categories,
  isArchivedCover
}: { 
  blog: BlogDto; 
  latestVersion: VersionDto;
  mediaList: MediaItem[];
  categories: BlogCategoryItem[];
  isArchivedCover?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(editBlogAction, null);
  const [statePublish, formActionPublish, isPendingPublish] = useActionState(editAndPublishBlogAction, null);
  const isAnyPending = isPending || isPendingPublish;
  const activeState = state || statePublish;
  
  const [title, setTitle] = useState(latestVersion.title);
  const [summary, setSummary] = useState(latestVersion.summary);
  const [categoryId, setCategoryId] = useState(latestVersion.categoryId || "");
  const [contentMarkdown, setContentMarkdown] = useState(latestVersion.contentMarkdown);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(latestVersion.coverMediaAssetId || null);
  const [coverAltText, setCoverAltText] = useState<string>(latestVersion.coverAltText || "");
  const [changeSummary, setChangeSummary] = useState("");
  const [viewMode, setViewMode] = useState<SplitViewMode>("split");
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentData = {
    title,
    summary,
    categoryId: categoryId || null,
    contentMarkdown,
    coverMediaAssetId: coverMediaId,
    coverAltText,
    changeSummary,
  };

  const draftKey = `devnova:blog-draft:edit:${blog.id}`;
  const draftProps = useLocalBlogDraft({ 
    draftKey, 
    currentData
  });
  const router = useRouter();

  useEffect(() => {
    if (statePublish?.success) {
      draftProps.clearDraftOnSuccess();
      router.push(`/dashboard/blogs`);
    } else if (state?.success) {
      draftProps.clearDraftOnSuccess();
    }
  }, [state, statePublish, draftProps, router]);

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

  const insertMultipleIntoMarkdown = (items: { id: string, alt: string }[]) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const insertText = items.map(item => `![${item.alt}](media://${item.id})`).join("\n\n");
    
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

  const EditorComponent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", paddingRight: viewMode === "split" ? "12px" : "0" }}>
      <div className={styles.editorToolbar} style={{ position: "sticky", top: "12px", zIndex: 10, backgroundColor: "#ffffff" }}>
        <button type="button" onClick={() => insertFormatting("**")} className={styles.toolbarBtn} title="Negrita"><b>B</b></button>
        <button type="button" onClick={() => insertFormatting("*")} className={styles.toolbarBtn} title="Cursiva"><i>I</i></button>
        <div style={{ width: "1px", height: "20px", background: "#e5e7eb", margin: "0 4px", alignSelf: "center" }} />
        <button type="button" onClick={() => insertFormatting("### ", "")} className={styles.toolbarBtn}>H3</button>
        <button type="button" onClick={() => insertFormatting("#### ", "")} className={styles.toolbarBtn}>H4</button>
        <div style={{ width: "1px", height: "20px", background: "#e5e7eb", margin: "0 4px", alignSelf: "center" }} />
        <button type="button" onClick={() => insertFormatting("[", "](url)")} className={styles.toolbarBtn}>Enlace</button>
        <button type="button" onClick={() => insertFormatting("`")} className={styles.toolbarBtn}>Código</button>
        <button type="button" onClick={() => insertFormatting("```\n", "\n```")} className={styles.toolbarBtn}>Bloque</button>
        <button type="button" onClick={() => insertFormatting("> ", "")} className={styles.toolbarBtn}>Cita</button>
        <button type="button" onClick={() => insertFormatting("- ", "")} className={styles.toolbarBtn}>Lista</button>
        <div style={{ width: "1px", height: "20px", background: "#e5e7eb", margin: "0 4px", alignSelf: "center" }} />
        <MediaPicker 
          mediaList={mediaList} 
          requireAltText={true} 
          buttonLabel="📸 Insertar imagen" 
          onSelect={insertIntoMarkdown}
          onSelectMultiple={insertMultipleIntoMarkdown}
        />
      </div>
      <textarea
        id="contentMarkdown"
        name="contentMarkdown"
        ref={textareaRef}
        required
        className={styles.modernTextarea}
        style={{ flex: 1, minHeight: "800px" }}
        placeholder="Comienza a escribir tu contenido aquí..."
        value={contentMarkdown}
        onChange={(e) => setContentMarkdown(e.target.value)}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      />
      
      <div style={{ marginTop: "24px", backgroundColor: "#f9fafb", padding: "16px", borderRadius: "10px", border: "1px solid #e5e7eb", flexShrink: 0 }}>
        <label htmlFor="changeSummary" className={styles.label} style={{ color: "#374151" }}>Resumen del cambio (Auditoría) *</label>
        <input
          id="changeSummary"
          name="changeSummary"
          type="text"
          required
          maxLength={500}
          className={styles.modernInput}
          style={{ backgroundColor: "#ffffff", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", marginTop: "8px", fontSize: "0.9rem" }}
          placeholder="Ej: Corrección de introducción"
          value={changeSummary}
          onChange={(e) => setChangeSummary(e.target.value)}
        />
      </div>
    </div>
  );

  const PreviewComponent = (
    <div style={{ height: "100%", paddingLeft: viewMode === "split" ? "12px" : "0", alignSelf: "flex-start", position: "sticky", top: "12px" }}>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", backgroundColor: "#ffffff" }}>
        <BlogPreviewClient 
          blog={{
            title: title || "Sin título",
            summary: summary || "Sin resumen",
            slug: blog.slug,
            contentMarkdown: contentMarkdown || "*No hay contenido aún*",
            coverMediaAssetId: coverMediaId,
            coverAltText,
            creatorName: blog.creatorName || undefined,
            categoryName: categories.find(c => c.id === categoryId)?.name,
            categorySlug: categories.find(c => c.id === categoryId)?.slug,
          }}
          mediaMap={new Map(mediaList.map(m => [m.id, { id: m.id, publicId: m.publicId, width: m.width, height: m.height }]))}
        />
      </div>
    </div>
  );

  const containerStyle = viewMode === "split" 
    ? { width: "100vw", marginLeft: "calc(50% - 50vw)", padding: "0 40px" }
    : { maxWidth: "900px", margin: "0 auto" };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", ...containerStyle }}>
      
      {/* HEADER / BARRA DE ACCIONES SUPERIOR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexShrink: 0, gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h2 className={styles.title} style={{ fontSize: "1.5rem", marginBottom: 0 }}>Editando: {latestVersion.title}</h2>
            {draftProps.saveStatus !== "idle" && (
              <span style={{ fontSize: "0.8rem", color: "#6b7280", background: "#f3f4f6", padding: "4px 8px", borderRadius: "4px", whiteSpace: "nowrap" }}>
                {draftProps.saveStatus === "saving" ? "Guardando..." : `Guardado local a las ${new Date(draftProps.lastSavedAt || 0).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "0.8rem", color: "#6b7280", marginTop: "4px" }}>
            <span>Versión actual: v{latestVersion.versionNumber}</span>
            <span>Última edición: {latestVersion.createdAt.toLocaleDateString()}</span>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className={styles.viewModeContainer}>
            <button className={`${styles.viewModeButton} ${viewMode === "editor" ? styles.active : ""}`} onClick={() => setViewMode("editor")} title="Solo Editor">
              Editor
            </button>
            <button className={`${styles.viewModeButton} ${viewMode === "split" ? styles.active : ""}`} onClick={() => setViewMode("split")} title="Vista Dividida">
              Dividido
            </button>
            <button className={`${styles.viewModeButton} ${viewMode === "preview" ? styles.active : ""}`} onClick={() => setViewMode("preview")} title="Pantalla Completa">
              Vista Previa
            </button>
          </div>
          
          <Link href={`/dashboard/blogs/${blog.id}/preview`} target="_blank" className={styles.actionButton} style={{ display: "inline-flex", alignItems: "center", height: "34px", padding: "0 12px", margin: 0 }}>
            Abrir ↗
          </Link>
          
          <ImportMarkdownButton onImport={handleImport} hasExistingContent={true} />
          
          <div style={{ width: "1px", height: "24px", background: "#e5e7eb" }}></div>
          
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Link href="/dashboard/blogs" className={styles.actionButton} style={{ padding: "8px 16px", margin: 0 }}>
              Volver
            </Link>
            <button type="submit" form="edit-blog-form" formAction={formAction} disabled={isAnyPending} className={styles.submitButton} style={{ margin: 0, padding: "8px 16px", backgroundColor: "#f3f4f6", color: "#1f2937", border: "1px solid #d1d5db" }}>
              {isPending ? "Guardando..." : "Guardar Borrador"}
            </button>
            <button type="submit" form="edit-blog-form" formAction={formActionPublish} disabled={isAnyPending} className={styles.submitButton} style={{ margin: 0, padding: "8px 16px", backgroundColor: "#10b981" }}>
              {isPendingPublish ? "Publicando..." : "Guardar y Publicar"}
            </button>
          </div>
        </div>
      </div>
      
      {draftProps.hasDraft && (
        <div style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }} role="status">
          <div>
            <p style={{ margin: "0 0 2px 0", fontWeight: 600, color: "#0369a1", fontSize: "0.9rem" }}>Borrador recuperado</p>
            {draftProps.isStale ? (
              <p style={{ margin: 0, color: "#d97706", fontSize: "0.8rem", fontWeight: 500 }}>⚠️ Este borrador local fue creado sobre una versión anterior del blog.</p>
            ) : (
              <p style={{ margin: 0, color: "#0ea5e9", fontSize: "0.8rem" }}>Puedes restaurarlo o descartarlo para seguir con la versión de la base de datos.</p>
            )}
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button type="button" onClick={draftProps.discardDraft} style={{ background: "none", border: "none", color: "#0369a1", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline" }}>Descartar</button>
            <button type="button" onClick={restoreDraft} style={{ backgroundColor: draftProps.isStale ? "#d97706" : "#0284c7", color: "white", border: "none", borderRadius: "4px", padding: "4px 10px", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>Cargar</button>
          </div>
        </div>
      )}

      {/* FORM AND METADATA */}
      <form id="edit-blog-form" style={{ display: "flex", flexDirection: "column", flex: 1, paddingBottom: "24px" }}>
        {activeState?.error && (
          <div className={styles.errorMessage} role="alert">
            {activeState.error}
          </div>
        )}

        {activeState?.success && (
          <div className={styles.successMessage} role="alert">
            {activeState.success}
          </div>
        )}

        <input type="hidden" name="blogId" value={blog.id} />
        <input type="hidden" name="baseVersionId" value={latestVersion.id} />
        
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

        {coverMediaId && <input type="hidden" name="coverMediaAssetId" value={coverMediaId} />}
        {coverAltText && <input type="hidden" name="coverAltText" value={coverAltText} />}

        {/* METADATA FIELDS (Moved to the top) */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
            <div style={{ flex: "1 1 300px" }}>
              <input
                id="title"
                name="title"
                type="text"
                required
                maxLength={200}
                className={styles.modernInput}
                style={{ fontSize: "2rem", fontWeight: 700 }}
                placeholder="Título del artículo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div style={{ flex: "0 0 auto", minWidth: "200px" }}>
              {selectedCover ? (
                <div style={{ display: "flex", gap: "12px", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px" }}>
                  <div style={{ position: "relative", width: "60px", height: "40px", backgroundColor: "#f1f2f4", borderRadius: "4px", overflow: "hidden" }}>
                    <Image src={selectedCover.thumbnailUrl} alt={coverAltText} fill style={{ objectFit: "cover" }} unoptimized />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedCover.originalFilename}</div>
                    <button type="button" onClick={() => { setCoverMediaId(null); setCoverAltText(""); }} style={{ color: "#d93025", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", padding: 0 }}>Eliminar</button>
                  </div>
                </div>
              ) : isArchivedCover ? (
                <div style={{ display: "flex", gap: "12px", alignItems: "center", border: "1px solid #f8c2b7", backgroundColor: "#fce8e6", borderRadius: "8px", padding: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#d93025" }}>Portada archivada</div>
                    <button type="button" onClick={() => { setCoverMediaId(null); setCoverAltText(""); }} style={{ color: "#d93025", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", padding: 0, textDecoration: "underline", fontWeight: "bold" }}>Remover</button>
                  </div>
                </div>
              ) : (
                <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
                  <MediaPicker 
                    mediaList={mediaList} 
                    requireAltText={true} 
                    buttonLabel="Añadir portada" 
                    onSelect={(id, alt) => {
                      setCoverMediaId(id);
                      setCoverAltText(alt);
                    }} 
                  />
                </div>
              )}
            </div>
          </div>

          <input
            id="summary"
            name="summary"
            type="text"
            required
            maxLength={500}
            className={styles.modernInput}
            style={{ marginBottom: "16px" }}
            placeholder="Escribe un breve resumen de lo que trata el artículo..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />

          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <select
                id="categoryId"
                name="categoryId"
                className={styles.modernInput}
                style={{ fontSize: "0.9rem", color: categoryId ? "#121419" : "#9ca3af" }}
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
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
               <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>Slug: /{blog.slug}</span>
            </div>
          </div>
        </div>

        {/* SPLIT VIEW WITH MARKDOWN EDITOR AND PREVIEW */}
        <ResizableSplitView
          mode={viewMode}
          editor={EditorComponent}
          preview={PreviewComponent}
          initialEditorWidth={50}
        />
        
      </form>
    </div>
  );
}
