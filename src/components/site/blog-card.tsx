import Link from "next/link";
import Image from "next/image";
import styles from "./blog-card.module.css";
import { IconoTerminal, IconoInfo } from "./devbox-pieces";

interface BlogCardProps {
  slug: string;
  title: string;
  summary?: string | null;
  author: string;
  date: Date | string;
  categoryName?: string | null;
  coverPublicId?: string | null;
  coverUrl?: string | null;
}

export function BlogCard({ slug, title, summary, author, date, categoryName, coverPublicId, coverUrl }: BlogCardProps) {
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));

  return (
    <Link href={`/blogs/${slug}`} className={styles.card}>
      {/* Cover */}
      <div className={styles.cover}>
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={styles.coverImg}
            unoptimized
          />
        ) : (
          <div className={styles.coverPlaceholder}>
            <IconoTerminal />
          </div>
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        {summary && <p className={styles.summary}>{summary}</p>}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.meta}>
          {categoryName && (
            <span className={styles.category}>{categoryName}</span>
          )}
          <span>{formattedDate}</span>
        </div>

        <div className={styles.infoWrap}>
          <button
            type="button"
            className={styles.infoBtn}
            aria-label="Ver detalles"
            tabIndex={0}
          >
            <IconoInfo />
          </button>
          <div className={styles.popover} role="tooltip">
            <div className={styles.popoverRow}>
              <span className={styles.popoverLabel}>Autor</span>
              <span className={styles.popoverValue}>{author}</span>
            </div>
            <div className={styles.popoverRow}>
              <span className={styles.popoverLabel}>Publicado</span>
              <span className={styles.popoverValue}>{formattedDate}</span>
            </div>
            <div className={styles.popoverRow}>
              <span className={styles.popoverLabel}>Categoría</span>
              <span className={styles.popoverValue}>{categoryName || "Sin categoría"}</span>
            </div>
            <div className={styles.popoverRow}>
              <span className={styles.popoverLabel}>Estado</span>
              <span className={styles.popoverValue}>Publicado</span>
            </div>
            <div className={styles.popoverRow}>
              <span className={styles.popoverLabel}>Formato</span>
              <span className={styles.popoverValue}>Markdown</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
