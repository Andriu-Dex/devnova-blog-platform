import { requireAuthorOrAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { listActiveMedia } from "@/server/media/media-service";
import { MediaUploader } from "@/components/media/media-uploader";
import { DeleteMediaButton } from "./delete-media-button";
import styles from "../blogs/blogs.module.css";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Biblioteca Multimedia | DevNova",
  description: "Gestión de archivos multimedia",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default async function MediaPage() {
  const user = await requireAuthorOrAdmin();
  const mediaList = await listActiveMedia();

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Biblioteca de Multimedia</h1>
          <Link href="/dashboard" className={styles.subtitle}>
            ← Volver al panel de publicaciones
          </Link>
        </div>
      </div>

      <MediaUploader />

      <div className={styles.tableContainer}>
        <h2
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: "1.25rem",
            margin: "0 0 20px 0",
            color: "#121419",
          }}
        >
          Archivos Multimedia Disponibles ({mediaList.length})
        </h2>

        {mediaList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#74777e", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
            No hay archivos multimedia subidos en la biblioteca.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {mediaList.map((item) => (
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
                    style={{ objectFit: "cover" }}
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
                        backgroundColor: "#f1f2f4",
                        color: "#51545a",
                        border: "1px solid #c9c6bb",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontFamily: "'IBM Plex Mono', Consolas, monospace",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {item.format}
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
                      {item.width} × {item.height} px • {formatBytes(item.sizeBytes)}
                    </span>
                    <span>Subido por: {item.uploaderName}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>

                  {user.role === "ADMIN" && (
                    <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px dashed #c9c6bb" }}>
                      <DeleteMediaButton mediaAssetId={item.id} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
