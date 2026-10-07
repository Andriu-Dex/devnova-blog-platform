"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styles from "./media-picker.module.css";

const emptySubscribe = () => () => {};

export interface MediaItem {
  id: string;
  publicId: string;
  format: string;
  originalFilename: string;
  width: number;
  height: number;
  sizeBytes: number;
  uploaderName: string;
  createdAt: Date;
  deletedAt?: Date | null;
  thumbnailUrl: string;
}

interface MediaPickerProps {
  mediaList: MediaItem[];
  onSelect: (mediaId: string, altText: string) => void;
  onSelectMultiple?: (items: {id: string, alt: string}[]) => void;
  onMediaUploaded?: (item: MediaItem) => void;
  requireAltText: boolean;
  buttonLabel: string;
  className?: string;
}

export function MediaPicker({ mediaList, onSelect, onSelectMultiple, onMediaUploaded, requireAltText, buttonLabel, className }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [error, setError] = useState("");
  const [localUploaded, setLocalUploaded] = useState<MediaItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const combinedMediaList = [
    ...localUploaded,
    ...mediaList.filter(m => !localUploaded.some(u => u.id === m.id))
  ];

  const handleOpen = () => {
    setIsOpen(true);
    setSelectedId(null);
    setAltText("");
    setError("");
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelect = () => {
    if (!selectedId) {
      setError("Debes seleccionar una imagen.");
      return;
    }
    const cleanAlt = altText.trim();
    if (requireAltText && !cleanAlt) {
      setError("El texto alternativo es obligatorio.");
      inputRef.current?.focus();
      return;
    }
    onSelect(selectedId, cleanAlt);
    handleClose();
  };

  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isUploading) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isUploading]);

  const handleUpload = async (files: File[] | FileList) => {
    if (files.length === 0) return;
    setError("");
    setIsUploading(true);
    try {
      const { uploadFileDirectly } = await import("./direct-uploader");
      
      const uploadedItems = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadFileDirectly(file);
        const cleanAlt = (files.length === 1 ? altText.trim() : "") || file.name;
        uploadedItems.push({ id: res.mediaAssetId, alt: cleanAlt });

        const uploadedMedia = res.mediaItem;
        if (uploadedMedia) {
          setLocalUploaded((prev) => [uploadedMedia, ...prev.filter(p => p.id !== uploadedMedia.id)]);
          if (onMediaUploaded) {
            onMediaUploaded(uploadedMedia);
          }
        }
      }
      
      if (onSelectMultiple) {
        onSelectMultiple(uploadedItems);
      } else if (uploadedItems.length > 0) {
        onSelect(uploadedItems[0].id, uploadedItems[0].alt);
      }
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al subir la(s) imagen(es)");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={className || styles.triggerButton}
      >
        {buttonLabel}
      </button>

      {isMounted && isOpen && typeof document !== "undefined" && createPortal(
        <div
          className={styles.modalOverlay}
          onClick={() => !isUploading && handleClose()}
          role="presentation"
        >
          <div
            className={styles.modalContent}
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-picker-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 id="media-picker-title" className={styles.modalTitle}>Multimedia</h2>
              <button
                type="button"
                onClick={handleClose}
                className={styles.closeButton}
                aria-label="Cerrar selector de multimedia"
                disabled={isUploading}
              >
                &times;
              </button>
            </div>
            
            <div style={{ display: "flex", gap: "16px", padding: "0 24px", borderBottom: "1px solid #e5e7eb", marginBottom: "16px" }}>
              <button 
                type="button" 
                onClick={() => setActiveTab("library")} 
                style={{ background: "none", border: "none", padding: "12px 0", borderBottom: activeTab === "library" ? "2px solid var(--color-cyan, #28c7e8)" : "2px solid transparent", fontWeight: activeTab === "library" ? 600 : 400, cursor: "pointer", color: activeTab === "library" ? "var(--color-carbon, #121419)" : "#6b7280" }}
              >
                Biblioteca
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab("upload")} 
                style={{ background: "none", border: "none", padding: "12px 0", borderBottom: activeTab === "upload" ? "2px solid var(--color-cyan, #28c7e8)" : "2px solid transparent", fontWeight: activeTab === "upload" ? 600 : 400, cursor: "pointer", color: activeTab === "upload" ? "var(--color-carbon, #121419)" : "#6b7280" }}
              >
                Subir nueva
              </button>
            </div>

            <div className={styles.modalBody}>
              {activeTab === "library" ? (
                combinedMediaList.length === 0 ? (
                  <div className={styles.emptyState}>
                    No hay archivos disponibles en la biblioteca.
                  </div>
                ) : (
                  <div className={styles.grid}>
                    {combinedMediaList.map((item) => {
                      const isSelected = selectedId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedId(item.id);
                            }
                          }}
                          className={`${styles.mediaItem} ${isSelected ? styles.mediaItemSelected : ""}`}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          aria-label={`Seleccionar imagen ${item.originalFilename}`}
                        >
                          <div className={styles.mediaImageWrap}>
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.originalFilename}
                              fill
                              sizes="(max-width: 768px) 100vw, 180px"
                              style={{ objectFit: "cover" }}
                              unoptimized
                            />
                          </div>
                          <div className={styles.mediaLabel}>
                            {item.originalFilename}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "240px", border: "2px dashed #d1d5db", borderRadius: "8px", padding: "24px", textAlign: "center", backgroundColor: "#f9fafb" }}>
                  {isUploading ? (
                    <div style={{ color: "var(--color-primary, #155eef)", fontWeight: 500 }}>
                      Subiendo archivo de forma segura...
                    </div>
                  ) : (
                    <>
                      <p style={{ color: "#4b5563", marginBottom: "16px" }}>
                        Selecciona una o más imágenes desde tu dispositivo para subirlas directamente.
                      </p>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={onFileChange} 
                        style={{ display: "none" }} 
                        ref={fileInputRef} 
                        multiple
                      />
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        style={{ backgroundColor: "var(--color-primary, #155eef)", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                      >
                        Buscar archivo
                      </button>
                      <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "12px" }}>
                        Formatos soportados: JPG, PNG, WebP (máx. 10 MB)
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              {error && <div className={styles.error} role="alert">{error}</div>}
              
              <div className={styles.footerControls}>
                <div className={styles.inputWrap}>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={requireAltText ? "Texto alternativo (requerido)" : "Texto alternativo (opcional)"}
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    className={styles.input}
                    aria-required={requireAltText}
                    aria-label="Texto alternativo de la imagen"
                    disabled={isUploading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && activeTab === "library" && selectedId) {
                        e.preventDefault();
                        handleSelect();
                      }
                    }}
                  />
                </div>
                {activeTab === "library" && (
                  <button
                    type="button"
                    onClick={handleSelect}
                    disabled={!selectedId}
                    className={styles.confirmButton}
                  >
                    Confirmar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
