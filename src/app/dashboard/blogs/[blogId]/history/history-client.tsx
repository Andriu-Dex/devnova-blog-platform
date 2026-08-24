"use client";

import { useState, useTransition } from "react";
import styles from "../../blogs.module.css";
import { publishBlogAction, unpublishBlogAction, restoreBlogAction } from "../../actions";

type Version = {
  id: string;
  versionNumber: number;
  title: string;
  summary: string;
  changeSummary: string | null;
  editorName: string;
  createdAt: Date;
  restoredFromVersionNumber?: number;
  isPublished: boolean;
  isLatest: boolean;
  hasCover: boolean;
};

export function HistoryClient({
  blogId,
  canPublish,
  canUnpublish,
  history,
}: {
  blogId: string;
  canPublish: boolean;
  canUnpublish: boolean;
  history: Version[];
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [restoreReason, setRestoreReason] = useState("");

  const handlePublish = () => {
    if (confirm("¿Estás seguro de publicar la última versión del blog?")) {
      setErrorMsg(null);
      startTransition(async () => {
        const res = await publishBlogAction(blogId);
        if (res?.error) setErrorMsg(res.error);
      });
    }
  };

  const handleUnpublish = () => {
    if (confirm("¿Estás seguro de despublicar este blog?")) {
      setErrorMsg(null);
      startTransition(async () => {
        const res = await unpublishBlogAction(blogId);
        if (res?.error) setErrorMsg(res.error);
      });
    }
  };

  const openRestoreModal = (version: Version) => {
    setSelectedVersion(version);
    setRestoreReason("");
    setRestoreModalOpen(true);
  };

  const handleRestore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersion) return;

    const formData = new FormData();
    formData.append("blogId", blogId);
    formData.append("sourceVersionId", selectedVersion.id);
    formData.append("reason", restoreReason);

    setErrorMsg(null);
    startTransition(async () => {
      const res = await restoreBlogAction(null, formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setRestoreModalOpen(false);
        setSelectedVersion(null);
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginBottom: "24px" }}>
        {canPublish && (
          <button
            onClick={handlePublish}
            disabled={isPending}
            className={styles.actionButton}
            style={{ background: "#4caf50", opacity: isPending ? 0.7 : 1 }}
          >
            Publicar última versión
          </button>
        )}
        {canUnpublish && (
          <button
            onClick={handleUnpublish}
            disabled={isPending}
            className={styles.actionButton}
            style={{ background: "#f5a623", color: "#000", opacity: isPending ? 0.7 : 1 }}
          >
            Despublicar
          </button>
        )}
      </div>

      {errorMsg && (
        <div style={{ color: "#cc3333", marginBottom: "16px", background: "#f8d7da", padding: "10px", borderRadius: "4px" }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {history.map((v) => (
          <div
            key={v.id}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "16px",
              background: v.isLatest ? "#f0fdf4" : "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ fontSize: "1.1rem" }}>v{v.versionNumber}</strong>
                {v.isLatest && <span className={`${styles.statusPill} ${styles.statusPublished}`}>Actual</span>}
                {v.isPublished && <span className={`${styles.statusPill} ${styles.statusPublished}`} style={{ background: "#3b82f6" }}>Publicada</span>}
                {v.restoredFromVersionNumber && (
                  <span className={`${styles.statusPill} ${styles.statusDraft}`}>
                    Restaurada desde v{v.restoredFromVersionNumber}
                  </span>
                )}
                {v.hasCover && (
                  <span className={`${styles.statusPill} ${styles.statusDraft}`} style={{ background: "#f3e8ff", color: "#6b21a8" }}>
                    Con portada
                  </span>
                )}
              </div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "1rem", color: "#111827" }}>{v.title}</h3>
              <p style={{ margin: "0 0 8px 0", fontSize: "0.85rem", color: "#4b5563" }}>{v.summary}</p>
              
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                <span>Editado por {v.editorName}</span> • <span>{new Date(v.createdAt).toLocaleString()}</span>
                {v.changeSummary && <span> • <em>&quot;{v.changeSummary}&quot;</em></span>}
              </div>
            </div>
            
            {!v.isLatest && (
              <button
                onClick={() => openRestoreModal(v)}
                disabled={isPending}
                className={styles.actionButton}
                style={{ background: "#4a4a4a", opacity: isPending ? 0.7 : 1 }}
              >
                Restaurar como nueva versión
              </button>
            )}
          </div>
        ))}
      </div>

      {restoreModalOpen && selectedVersion && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "8px", maxWidth: "500px", width: "100%" }}>
            <h2 style={{ marginTop: 0 }}>Restaurar v{selectedVersion.versionNumber}</h2>
            <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "16px" }}>
              Se creará una nueva versión. El historial anterior no será eliminado.
            </p>
            <form onSubmit={handleRestore}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "0.9rem" }}>Motivo de restauración</label>
                <textarea 
                  value={restoreReason}
                  onChange={(e) => setRestoreReason(e.target.value)}
                  maxLength={500}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minHeight: "80px" }}
                  placeholder="Se recupera la versión previa a la reestructuración."
                />
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button 
                  type="button" 
                  onClick={() => setRestoreModalOpen(false)}
                  className={styles.actionButton}
                  style={{ background: "#9ca3af" }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isPending || !restoreReason.trim()}
                  className={styles.actionButton}
                  style={{ background: "#2563eb", opacity: (isPending || !restoreReason.trim()) ? 0.7 : 1 }}
                >
                  {isPending ? "Restaurando..." : "Restaurar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
