"use client";

import { useState, useActionState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createBlogAction, createAndPublishBlogAction } from "../actions";
import { MediaPicker, MediaItem } from "@/components/media/media-picker";
import { BlogPreviewClient } from "@/components/blogs/blog-preview-client";
import { ResizableSplitView, SplitViewMode } from "@/components/ui/resizable-split-view";
import { ImportMarkdownButton } from "@/components/blogs/import-markdown-button";
import { useLocalBlogDraft } from "@/components/blogs/hooks/use-local-blog-draft";
import styles from "../blogs.module.css";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface NewBlogFormProps {
  mediaList: MediaItem[];
  categories: CategoryOption[];
}

export function NewBlogForm({ mediaList, categories }: NewBlogFormProps) {
  const [state, formAction, isPending] = useActionState(createBlogAction, null);
  const [statePublish, formActionPublish, isPendingPublish] = useActionState(createAndPublishBlogAction, null);
  const isAnyPending = isPending || isPendingPublish;
  const activeState = statePublish || state;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
  const [coverAltText, setCoverAltText] = useState<string>("");
  const [viewMode, setViewMode] = useState<SplitViewMode>("split");
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);

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

  // Clear draft on successful creation
  useEffect(() => {
    if (statePublish?.success) {
      draftProps.clearDraftOnSuccess();
      router.push(`/dashboard/blogs`);
    } else if (state?.success && state?.blogId) {
      draftProps.clearDraftOnSuccess();
      router.push(`/dashboard/blogs/${state.blogId}/edit`);
    }
  }, [state, statePublish, draftProps, router]);

  // Keyboard shortcut Ctrl+S / Cmd+S to submit draft
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!isAnyPending) {
          const form = document.getElementById("blog-form") as HTMLFormElement | null;
          if (form) {
            form.requestSubmit();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnyPending]);

  const [currentMediaList, setCurrentMediaList] = useState<MediaItem[]>(mediaList);

  const handleMediaUploaded = (newMedia: MediaItem) => {
    setCurrentMediaList((prev) => [newMedia, ...prev.filter((m) => m.id !== newMedia.id)]);
  };

  const selectedCover = coverMediaId ? currentMediaList.find((m) => m.id === coverMediaId) : null;

  const insertIntoMarkdown = (mediaId: string, altText: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const insertText = `![${altText || "imagen"}](media://${mediaId})`;
    
    textarea.setRangeText(
      insertText,
      textarea.selectionStart,
      textarea.selectionEnd,
      "end"
    );
    setContentMarkdown(textarea.value);
    textarea.focus();
  };

  const insertMultipleIntoMarkdown = (items: { id: string; alt: string }[]) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const insertText = items.map((item) => `![${item.alt || "imagen"}](media://${item.id})`).join("\n\n");
    
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
    
    const placeholder = `![Subiendo ${file.name}...]()`;
    textarea.setRangeText(
      placeholder,
      textarea.selectionStart,
      textarea.selectionEnd,
      "end"
    );
    setContentMarkdown(textarea.value);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("altText", file.name.replace(/\.[^/.]+$/, ""));

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok && data.success && data.media) {
        handleMediaUploaded(data.media);
        setContentMarkdown((prev) => 
          prev.replace(placeholder, `![${data.media.originalFilename}](media://${data.media.id})`)
        );
      } else {
        setContentMarkdown((prev) => prev.replace(placeholder, ""));
        alert(data.error || "Error al subir la imagen");
      }
    } catch {
      setContentMarkdown((prev) => prev.replace(placeholder, ""));
      alert("Error al procesar la subida");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith("image/")) {
        e.preventDefault();
        handleFileUpload(file);
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

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    
    // Auto-generate slug
    const generatedSlug = newTitle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
      
    setSlug(generatedSlug);
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

  const handleImport = (data: { title?: string; summary?: string; contentMarkdown: string }) => {
    if (data.title) handleTitleChange(data.title);
    if (data.summary) setSummary(data.summary);
    setContentMarkdown(data.contentMarkdown);
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

  // Word and reading stats
  const { wordCount, charCount, readingTime } = useMemo(() => {
    const trimmed = contentMarkdown.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = contentMarkdown.length;
    const time = Math.max(1, Math.ceil(words / 200));
    return { wordCount: words, charCount: chars, readingTime: time };
  }, [contentMarkdown]);

  const hasUnsavedContent = Boolean(title || summary || contentMarkdown);

  const handleBackClick = (e: React.MouseEvent) => {
    if (hasUnsavedContent) {
      if (!confirm("Tienes cambios sin guardar. ¿Deseas salir del editor?")) {
        e.preventDefault();
      }
    }
  };

  /* ──────────────── EDITOR PANE (LEFT) ──────────────── */
  const EditorComponent = (
    <div className={styles.editorPaneElevated}>
      {/* TOOLBAR */}
      <div className={styles.editorToolbarElevated}>
        <div className={styles.editorToolbarGroup}>
          <button type="button" onClick={() => insertFormatting("**")} className={styles.toolbarBtn} title="Negrita (Ctrl+B)"><b>B</b></button>
          <button type="button" onClick={() => insertFormatting("*")} className={styles.toolbarBtn} title="Cursiva (Ctrl+I)"><i>I</i></button>
          <div className={styles.editorToolbarSep} />
          <button type="button" onClick={() => insertFormatting("## ", "")} className={styles.toolbarBtn} title="Título H2">H2</button>
          <button type="button" onClick={() => insertFormatting("### ", "")} className={styles.toolbarBtn} title="Título H3">H3</button>
          <div className={styles.editorToolbarSep} />
          <button type="button" onClick={() => insertFormatting("[", "](url)")} className={styles.toolbarBtn} title="Insertar enlace">Enlace</button>
          <button type="button" onClick={() => insertFormatting("`")} className={styles.toolbarBtn} title="Código en línea">Código</button>
          <button type="button" onClick={() => insertFormatting("```\n", "\n```")} className={styles.toolbarBtn} title="Bloque de código">Bloque</button>
          <button 
            type="button" 
            onClick={() => insertFormatting("```mermaid\ngraph TD\n  A[Inicio] --> B[Proceso]\n  B --> C[Fin]\n```\n", "")} 
            className={styles.toolbarBtn}
            title="Insertar diagrama Mermaid"
            style={{ color: "#0284c7", fontWeight: 600 }}
          >
            📊 Mermaid
          </button>
          <button type="button" onClick={() => insertFormatting("> ", "")} className={styles.toolbarBtn} title="Cita">Cita</button>
          <button type="button" onClick={() => insertFormatting("- ", "")} className={styles.toolbarBtn} title="Lista">Lista</button>
          <div className={styles.editorToolbarSep} />
          <MediaPicker 
            mediaList={currentMediaList} 
            requireAltText={true} 
            buttonLabel="📸 Imagen" 
            className={styles.toolbarBtn}
            onSelect={insertIntoMarkdown}
            onSelectMultiple={insertMultipleIntoMarkdown}
            onMediaUploaded={handleMediaUploaded}
          />
        </div>

        {/* STATS */}
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", gap: "10px", alignItems: "center", whiteSpace: "nowrap" }}>
          <span>{wordCount} palabras ({charCount} car.)</span>
          <span>•</span>
          <span>~{readingTime} min</span>
        </div>
      </div>

      {/* TEXTAREA — scrolls independently, NO horizontal slider */}
      <textarea
        id="contentMarkdown"
        name="contentMarkdown"
        ref={textareaRef}
        required
        className={styles.editorTextareaElevated}
        placeholder="Comienza a escribir tu contenido aquí en Markdown..."
        value={contentMarkdown}
        onChange={(e) => setContentMarkdown(e.target.value)}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      />
    </div>
  );

  /* ──────────────── PREVIEW PANE (RIGHT) ──────────────── */
  const PreviewComponent = (
    <div className={styles.previewPaneElevated}>
      <div className={styles.previewHeaderElevated}>
        <div className={styles.previewHeaderLeft}>
          <span className={styles.previewDocIcon}>📄</span>
          <span className={styles.previewTitleText}>Vista previa en vivo</span>
          <span className={styles.previewLivePill}>
            <span className={styles.previewLiveDot} />
            en tiempo real
          </span>
        </div>

        <div className={styles.previewHeaderRight}>
          <div className={styles.overleafZoomControls} title="Ajustar escala (Zoom estilo Overleaf)">
            <button
              type="button"
              className={styles.overleafZoomBtn}
              onClick={() => setPreviewZoom((z) => Math.max(60, z - 10))}
              title="Alejar (Zoom Out)"
              disabled={previewZoom <= 60}
            >
              −
            </button>
            <button
              type="button"
              className={styles.overleafZoomPill}
              onClick={() => setPreviewZoom(100)}
              title="Restablecer escala al 100%"
            >
              {previewZoom}%
            </button>
            <button
              type="button"
              className={styles.overleafZoomBtn}
              onClick={() => setPreviewZoom((z) => Math.min(150, z + 10))}
              title="Acercar (Zoom In)"
              disabled={previewZoom >= 150}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Scrolls independently — no sync, NO horizontal slider */}
      <div
        ref={previewScrollRef}
        className={styles.previewScrollAreaElevated}
      >
        <div 
          className={styles.previewCanvasElevated}
          style={{
            zoom: previewZoom !== 100 ? `${previewZoom}%` : undefined,
          }}
        >
          <BlogPreviewClient 
            blog={{
              title: title || "Sin título",
              summary: summary || "Sin resumen",
              slug: slug || "sin-slug",
              contentMarkdown: contentMarkdown || "*Comienza a escribir en el editor para previsualizar aquí...*",
              coverMediaAssetId: coverMediaId,
              coverAltText,
              categoryName: categories.find((c) => c.id === categoryId)?.name,
              categorySlug: categories.find((c) => c.id === categoryId)?.slug,
            }}
            mediaMap={new Map(currentMediaList.map((m) => [m.id, { id: m.id, publicId: m.publicId, width: m.width, height: m.height }]))}
            isEditorPreview={true}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.editorPageContainer}>
      
      {/* ── TOP ACTION BAR ─────────────────────────────────────────────── */}
      <div className={styles.editorTopBar}>
        <div className={styles.editorTopBarLeft}>
          <h1 className={styles.editorPageTitle}>Nuevo borrador</h1>
          {draftProps.saveStatus !== "idle" && (
            <span className={styles.draftStatusBadge}>
              <span className={styles.draftStatusDot} />
              {draftProps.saveStatus === "saving"
                ? "Guardando…"
                : `Guardado a las ${new Date(draftProps.lastSavedAt || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          )}
        </div>

        <div className={styles.editorTopBarRight}>
          {/* View mode switcher */}
          <div className={styles.viewModePills}>
            <button
              type="button"
              className={`${styles.viewModePillBtn} ${viewMode === "editor" ? styles.active : ""}`}
              onClick={() => setViewMode("editor")}
            >
              Editor
            </button>
            <button
              type="button"
              className={`${styles.viewModePillBtn} ${viewMode === "split" ? styles.active : ""}`}
              onClick={() => setViewMode("split")}
            >
              Dividido
            </button>
            <button
              type="button"
              className={`${styles.viewModePillBtn} ${viewMode === "preview" ? styles.active : ""}`}
              onClick={() => setViewMode("preview")}
            >
              Vista Previa
            </button>
          </div>

          <div className={styles.topBarDivider} />

          <ImportMarkdownButton
            onImport={handleImport}
            hasExistingContent={hasUnsavedContent}
            className={styles.btnSecondary}
            buttonLabel="📥 Importar Markdown"
          />

          <Link href="/dashboard/blogs" onClick={handleBackClick} className={styles.btnGhost}>
            Cancelar
          </Link>

          <button
            type="submit"
            form="blog-form"
            formAction={formAction}
            disabled={isAnyPending}
            className={styles.btnSecondary}
            title="Crear borrador (Ctrl + S)"
          >
            {isPending ? "Guardando…" : "💾 Crear Borrador"}
            <kbd className={styles.kbdTag}>Ctrl+S</kbd>
          </button>

          <button
            type="submit"
            form="blog-form"
            formAction={formActionPublish}
            disabled={isAnyPending}
            className={styles.btnPrimaryPublish}
          >
            {isPendingPublish ? "Publicando…" : "🚀 Crear y Publicar"}
          </button>
        </div>
      </div>

      {/* ── RESTORE DRAFT BANNER ────────────────────────────────────────── */}
      {draftProps.hasDraft && (
        <div style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }} role="status">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0369a1" }}>Borrador local recuperado</span>
            <span style={{ fontSize: "0.8rem", color: "#0284c7" }}>Tienes cambios previos almacenados en tu navegador.</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={draftProps.discardDraft} style={{ background: "none", border: "none", color: "#0369a1", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline" }}>Descartar</button>
            <button type="button" onClick={restoreDraft} style={{ backgroundColor: "#0284c7", color: "white", border: "none", borderRadius: "6px", padding: "4px 12px", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>Cargar</button>
          </div>
        </div>
      )}

      {/* ── ERROR MESSAGE BAR ─────────────────────────────────────────── */}
      {activeState?.error && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 16px", color: "#991b1b", fontSize: "0.85rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }} role="alert">
          <span>⚠️</span>
          <span>{activeState.error}</span>
        </div>
      )}

      {/* ── FORM ──────────────────────────────────────────────────────── */}
      <form id="blog-form" style={{ display: "flex", flexDirection: "column" }}>
        {coverMediaId && <input type="hidden" name="coverMediaAssetId" value={coverMediaId} />}
        {coverAltText && <input type="hidden" name="coverAltText" value={coverAltText} />}

        {/* ── METADATA CARD (POSITIONED EXACTLY LIKE BEFORE) ──────────── */}
        <div className={styles.metadataCard}>
          {/* Row 1: Title & Cover Button */}
          <div className={styles.titleRow}>
            <div className={styles.titleInputWrapper}>
              <input
                id="title"
                name="title"
                type="text"
                required
                maxLength={200}
                className={styles.titleInputElevated}
                placeholder="Título del artículo"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            <div className={styles.coverActionWrapper}>
              {selectedCover ? (
                <div className={styles.coverCardMini}>
                  <div className={styles.coverCardMiniThumb}>
                    <Image src={selectedCover.thumbnailUrl} alt={coverAltText || "Portada"} fill style={{ objectFit: "cover" }} unoptimized />
                  </div>
                  <div className={styles.coverCardMiniDetails}>
                    <span className={styles.coverCardMiniName}>{selectedCover.originalFilename}</span>
                    <div className={styles.coverCardMiniActions}>
                      <MediaPicker 
                        mediaList={currentMediaList} 
                        requireAltText={true} 
                        buttonLabel="Cambiar" 
                        className={styles.btnGhost}
                        onSelect={(id, alt) => {
                          setCoverMediaId(id);
                          setCoverAltText(alt);
                        }}
                        onMediaUploaded={handleMediaUploaded}
                      />
                      <button 
                        type="button" 
                        onClick={() => { setCoverMediaId(null); setCoverAltText(""); }} 
                        style={{ color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", padding: 0 }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <MediaPicker 
                  mediaList={currentMediaList} 
                  requireAltText={true} 
                  buttonLabel="🖼️ Añadir portada" 
                  className={styles.btnCoverAdd}
                  onSelect={(id, alt) => {
                    setCoverMediaId(id);
                    setCoverAltText(alt);
                  }}
                  onMediaUploaded={handleMediaUploaded}
                />
              )}
            </div>
          </div>

          {/* Row 2: Summary */}
          <div>
            <input
              id="summary"
              name="summary"
              type="text"
              required
              maxLength={500}
              className={styles.summaryInputElevated}
              placeholder="Escribe un breve resumen de lo que trata el artículo..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          {/* Row 3: Slug and Category */}
          <div className={styles.bottomRow}>
            <div className={styles.slugInputGroup}>
              <span className={styles.slugPrefix}>/blogs/</span>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                maxLength={200}
                className={styles.slugInput}
                placeholder="slug-opcional"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <select
              id="categoryId"
              name="categoryId"
              className={styles.categorySelectElevated}
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
        </div>

        {/* ── WORKSPACE (SPLIT VIEW WITH OVERLEAF INDEPENDENT SCROLL) ──── */}
        <div className={styles.workspaceWrapper}>
          <ResizableSplitView
            mode={viewMode}
            editor={EditorComponent}
            preview={PreviewComponent}
            initialEditorWidth={50}
          />
        </div>
      </form>

    </div>
  );
}