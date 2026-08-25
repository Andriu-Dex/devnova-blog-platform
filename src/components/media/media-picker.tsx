"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./media-picker.module.css";

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
  requireAltText: boolean;
  buttonLabel: string;
}

export function MediaPicker({ mediaList, onSelect, requireAltText, buttonLabel }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setIsOpen(true);
    setSelectedId(null);
    setAltText("");
    setError("");
  };

  const handleClose = () => {
    setIsOpen(false);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={styles.triggerButton}
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div
          className={styles.modalOverlay}
          onClick={handleClose}
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
              <h2 id="media-picker-title" className={styles.modalTitle}>Seleccionar Multimedia</h2>
              <button
                type="button"
                onClick={handleClose}
                className={styles.closeButton}
                aria-label="Cerrar selector de multimedia"
              >
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              {mediaList.length === 0 ? (
                <div className={styles.emptyState}>
                  No hay archivos disponibles. Sube archivos primero.
                </div>
              ) : (
                <div className={styles.grid}>
                  {mediaList.map((item) => {
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSelect();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSelect}
                  disabled={!selectedId}
                  className={styles.confirmButton}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
