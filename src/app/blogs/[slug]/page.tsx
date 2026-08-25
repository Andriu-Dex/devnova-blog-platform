import { getPublishedBlogBySlug, listRelatedPublishedBlogs } from "@/server/blogs/public-blog-service";
import { getDeliveryUrl } from "@/server/media/cloudinary";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import { PublicHeader } from "@/components/site/public-header";
import { PublicFooter } from "@/components/site/public-footer";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cache } from "react";
import styles from "./slug.module.css";

export const dynamic = "force-dynamic";

const getBlogData = cache(async (slug: string) => {
  return await getPublishedBlogBySlug(slug);
});

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBlogData(slug);

  if (!result) return { title: "No encontrado" };

  const { blog } = result;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const images = blog.coverMediaAssetId ? [getDeliveryUrl(blog.coverMediaAssetId, 1200)] : [];

  return {
    title: `${blog.title} | DevNova Blog`,
    description: blog.summary,
    alternates: {
      canonical: siteUrl ? `${siteUrl}/blogs/${blog.slug}` : `/blogs/${blog.slug}`,
    },
    openGraph: {
      title: blog.title,
      description: blog.summary,
      url: siteUrl ? `${siteUrl}/blogs/${blog.slug}` : `/blogs/${blog.slug}`,
      type: "article",
      publishedTime: blog.publishedAt.toISOString(),
      authors: [blog.creatorName],
      images,
    },
    twitter: { card: "summary_large_image", title: blog.title, description: blog.summary, images },
  };
}

export default async function PublicBlogDetail({ params }: Props) {
  const { slug } = await params;
  const result = await getBlogData(slug);

  if (!result) notFound();

  const { blog, mediaMap } = result;

  return (
    <div className={styles.page}>
      <PublicHeader />

      <main style={{ flex: 1 }}>
        {/* Back breadcrumb */}
        <nav className={styles.backNav} aria-label="Navegación de retorno">
          <Link href="/blogs" className={styles.backLink}>
            ← Volver al Blog
          </Link>
        </nav>

        <div className={styles.article}>
          {/* Article header */}
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

          {/* Cover */}
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

          {/* Body */}
          <div className={styles.articleBody}>
            <MarkdownRenderer content={blog.contentMarkdown} mediaMap={mediaMap} />
          </div>
          
          {/* Related */}
          <RelatedBlogs currentBlogId={blog.id} />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

async function RelatedBlogs({ currentBlogId }: { currentBlogId: string }) {
  const related = await listRelatedPublishedBlogs({ excludeBlogId: currentBlogId, limit: 3 });
  
  if (related.length === 0) return null;

  return (
    <section className={styles.relatedSection} aria-label="También te puede interesar">
      <hr className={styles.relatedDivider} />
      <h2 className={styles.relatedTitle}>También te puede interesar</h2>
      <div className={styles.relatedGrid}>
        {related.map((item) => (
          <Link key={item.slug} href={`/blogs/${item.slug}`} className={styles.relatedCard}>
            <div className={styles.relatedImageWrap}>
              {item.coverMediaAssetId ? (
                <Image
                  src={getDeliveryUrl(item.coverMediaAssetId, 600)}
                  alt={item.coverAltText || item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              ) : (
                <div className={styles.relatedNoImage} aria-hidden="true">
                  {item.title.charAt(0)}
                </div>
              )}
            </div>
            <div className={styles.relatedCardBody}>
              <h3 className={styles.relatedCardTitle}>{item.title}</h3>
              <p className={styles.relatedCardSummary}>{item.summary}</p>
              <div className={styles.relatedCardMeta}>
                <span>{item.creatorName}</span>
                <time dateTime={new Date(item.publishedAt).toISOString()}>
                  {new Date(item.publishedAt).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })}
                </time>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
