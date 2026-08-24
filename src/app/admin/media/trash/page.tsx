import { requireAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { listDeletedMedia } from "@/server/media/media-service";
import { RecoverMediaButton } from "./recover-media-button";
import styles from "@/app/dashboard/blogs/blogs.module.css";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Papelera de Multimedia | DevNova Admin",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default async function MediaTrashPage() {
  const user = await requireAdmin();
  const deletedMedia = await listDeletedMedia();

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Papelera de Multimedia</h1>
          <Link href="/admin" className={styles.subtitle}>
            ← Volver al panel de administración
          </Link>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <h2
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: "1.25rem",
            margin: "0 0 20px 0",
            color: "#121419",
          }}
        >
          Archivos Archivados ({deletedMedia.length})
        </h2>

        {deletedMedia.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#74777e", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
            No hay archivos multimedia en la papelera.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {deletedMedia.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #c9c6bb",
                  borderRadius: "12px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  opacity: 0.85,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "180px",
                    backgroundColor: "#f1f2f4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.originalFilename}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    style={{ objectFit: "cover", filter: "grayscale(40%)" }}
                    unoptimized
                  />
                </div>

                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <strong
                      title={item.originalFilename}
                      style={{
                        fontFamily: "'Space Grotesk', Arial, sans-serif",
                        fontSize: "0.95rem",
                        color: "#121419",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "180px",
                      }}
                    >
                      {item.originalFilename}
                    </strong>
                    <span
                      style={{
                        backgroundColor: "#fcebeb",
                        color: "#d92d20",
                        border: "1px solid #d92d20",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontFamily: "'IBM Plex Mono', Consolas, monospace",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      Archivado
                    </span>
                  </div>

                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', Consolas, monospace",
                      fontSize: "0.75rem",
                      color: "#74777e",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span>
                      {item.width} × {item.height} px • {formatBytes(item.sizeBytes)} ({item.format.toUpperCase()})
                    </span>
                    <span>Subido por: {item.uploaderName}</span>
                    <span>Archivado el: {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : ""}</span>
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px dashed #c9c6bb" }}>
                    <RecoverMediaButton mediaAssetId={item.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
