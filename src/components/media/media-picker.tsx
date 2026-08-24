"use client";

import { useState } from "react";
import Image from "next/image";

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
      return;
    }
    onSelect(selectedId, cleanAlt);
    handleClose();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          backgroundColor: "#1655f8",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "6px",
          fontFamily: "'Space Grotesk', Arial, sans-serif",
          fontSize: "0.9rem",
          cursor: "pointer",
        }}
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fcfcfa",
              width: "90%",
              maxWidth: "800px",
              maxHeight: "90vh",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "20px", borderBottom: "1px solid #c9c6bb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>Seleccionar Multimedia</h2>
              <button
                type="button"
                onClick={handleClose}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#51545a" }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
              {mediaList.length === 0 ? (
                <div style={{ textAlign: "center", color: "#74777e", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
                  No hay archivos disponibles.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
                  {mediaList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      style={{
                        border: selectedId === item.id ? "3px solid #1655f8" : "1px solid #c9c6bb",
                        borderRadius: "8px",
                        overflow: "hidden",
                        cursor: "pointer",
                        position: "relative",
                      }}
                    >
                      <div style={{ position: "relative", width: "100%", height: "120px", backgroundColor: "#f1f2f4" }}>
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.originalFilename}
                          fill
                          sizes="(max-width: 768px) 100vw, 180px"
                          style={{ objectFit: "cover" }}
                          unoptimized
                        />
                      </div>
                      <div style={{ padding: "8px", fontSize: "0.8rem", fontFamily: "'Space Grotesk', Arial, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.originalFilename}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: "20px", borderTop: "1px solid #c9c6bb", backgroundColor: "#fff" }}>
              {error && <div style={{ color: "#d93025", fontSize: "0.9rem", marginBottom: "12px", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{error}</div>}
              
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  {requireAltText && (
                    <input
                      type="text"
                      placeholder="Texto alternativo (requerido)"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #c9c6bb",
                        borderRadius: "6px",
                        fontFamily: "'Space Grotesk', Arial, sans-serif",
                      }}
                    />
                  )}
                  {!requireAltText && (
                    <input
                      type="text"
                      placeholder="Texto alternativo (opcional)"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #c9c6bb",
                        borderRadius: "6px",
                        fontFamily: "'Space Grotesk', Arial, sans-serif",
                      }}
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSelect}
                  disabled={!selectedId}
                  style={{
                    backgroundColor: selectedId ? "#1655f8" : "#a8bdfa",
                    color: "white",
                    border: "none",
                    padding: "10px 24px",
                    borderRadius: "6px",
                    fontFamily: "'Space Grotesk', Arial, sans-serif",
                    cursor: selectedId ? "pointer" : "not-allowed",
                  }}
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
