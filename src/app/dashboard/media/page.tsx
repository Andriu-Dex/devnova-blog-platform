import { requireAuthorOrAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { listActiveMedia } from "@/server/media/media-service";
import { MediaUploader } from "@/components/media/media-uploader";
import { DeleteMediaButton } from "./delete-media-button";
import styles from "./media.module.css";
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
    <main className="private-page">
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
        <h2 className={styles.sectionTitle}>
          Archivos Multimedia Disponibles ({mediaList.length})
        </h2>

        {mediaList.length === 0 ? (
          <div className={styles.emptyState}>
            No hay archivos multimedia subidos en la biblioteca.
          </div>
        ) : (
          <div className={styles.grid}>
            {mediaList.map((item) => (
              <div key={item.id} className={styles.mediaCard}>
                <div className={styles.imageWrap}>
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.originalFilename}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <strong title={item.originalFilename} className={styles.filename}>
                      {item.originalFilename}
                    </strong>
                    <span className={styles.formatBadge}>
                      {item.format}
                    </span>
                  </div>

                  <div className={styles.metaInfo}>
                    <span>
                      {item.width} × {item.height} px • {formatBytes(item.sizeBytes)}
                    </span>
                    <span>Subido por: {item.uploaderName}</span>
                    <span>{new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' }).format(new Date(item.createdAt))}</span>
                  </div>

                  {user.role === "ADMIN" && (
                    <div className={styles.cardActions}>
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
