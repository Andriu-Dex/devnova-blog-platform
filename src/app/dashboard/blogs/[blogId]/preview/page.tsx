import { requireAuthorOrAdmin } from "@/server/auth/authorization";
import { getBlogPreview } from "@/server/blogs/blog-service";
import { getDeliveryUrl } from "@/server/media/cloudinary";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import { PrivateHeader } from "@/components/layout/private-header";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "@/app/blogs/[slug]/slug.module.css";

export const metadata: Metadata = {
  title: "Vista Previa del Blog | DevNova",
  robots: {
    index: false,
    follow: false,
  },
};

type Props = { params: Promise<{ blogId: string }> };

export default async function BlogPreviewPage({ params }: Props) {
  const user = await requireAuthorOrAdmin();
  const { blogId } = await params;
  
  const result = await getBlogPreview(blogId);
  if (!result) notFound();

  const { blog, mediaMap } = result;

  return (
    <div className={styles.page}>
      <PrivateHeader displayName={user.displayName} role={user.role} />

      <main style={{ flex: 1, backgroundColor: "#fff" }}>
        <div style={{ backgroundColor: "#fef3c7", padding: "12px", textAlign: "center", color: "#92400e", fontWeight: "bold", borderBottom: "1px solid #fde68a" }}>
          VISTA PREVIA — Esta versión LATEST no necesariamente está publicada.
        </div>

        <nav className={styles.backNav} aria-label="Navegación de retorno">
          <Link href={`/dashboard/blogs/${blog.id}/edit`} className={styles.backLink}>
            ← Volver al Editor
          </Link>
        </nav>

        <div className={styles.article}>
          <header className={styles.articleHeader}>
            <h1 className={styles.articleTitle}>{blog.title}</h1>
            <p className={styles.articleSummary}>{blog.summary}</p>
            <div className={styles.articleMeta}>
              <span className={styles.metaAuthor}>{blog.creatorName}</span>
              <span className={styles.metaDivider}>·</span>
              <time dateTime={new Date(blog.publishedAt).toISOString()}>
                {new Date(blog.publishedAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>
          </header>

          {blog.coverMediaAssetId && (
            <figure className={styles.coverWrap} aria-label={blog.coverAltText || blog.title}>
              <Image
                src={getDeliveryUrl(blog.coverMediaAssetId, 1200)}
                alt={blog.coverAltText || blog.title}
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                style={{ objectFit: "cover" }}
                priority
                unoptimized
              />
            </figure>
          )}

          <div className={styles.articleBody}>
            <MarkdownRenderer content={blog.contentMarkdown} mediaMap={mediaMap} />
          </div>
        </div>
      </main>
    </div>
  );
}
