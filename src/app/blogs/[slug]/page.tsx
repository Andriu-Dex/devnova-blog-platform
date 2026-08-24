import { getPublishedBlogBySlug } from "@/server/blogs/public-blog-service";
import { getDeliveryUrl } from "@/server/media/cloudinary";
import { MarkdownRenderer } from "@/components/blogs/markdown-renderer";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cache } from "react";

export const dynamic = "force-dynamic";

// Request-scoped memoization to prevent fetching the same blog twice (once for metadata, once for page)
const getBlogData = cache(async (slug: string) => {
  return await getPublishedBlogBySlug(slug);
});

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBlogData(slug);

  if (!result) {
    return {
      title: "No encontrado",
    };
  }

  const { blog } = result;
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const images = [];

  if (blog.coverMediaAssetId) {
    images.push(getDeliveryUrl(blog.coverMediaAssetId, 1200));
  }

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
      images: images,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.summary,
      images: images,
    },
  };
}

export default async function PublicBlogDetail({ params }: Props) {
  const { slug } = await params;
  const result = await getBlogData(slug);

  if (!result) {
    notFound();
  }

  const { blog, mediaMap } = result;

  return (
    <main style={{ backgroundColor: "#fcfcfa", minHeight: "100vh", color: "#121419", padding: "0 0 60px 0" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        
        <nav style={{ marginBottom: "32px" }}>
          <Link href="/blogs" style={{ color: "#1655f8", textDecoration: "none", fontSize: "1rem", fontWeight: "bold" }}>
            ← Volver a Blogs
          </Link>
        </nav>

        <article>
          <header style={{ marginBottom: "40px" }}>
            <h1 style={{ fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: "3rem", margin: "0 0 16px 0", lineHeight: 1.2 }}>
              {blog.title}
            </h1>
            <p style={{ fontSize: "1.25rem", color: "#51545a", margin: "0 0 24px 0", lineHeight: 1.5 }}>
              {blog.summary}
            </p>
            
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid #c9c6bb", borderBottom: "1px solid #c9c6bb", padding: "16px 0" }}>
              <div style={{ fontWeight: 600, color: "#121419" }}>{blog.creatorName}</div>
              <div style={{ color: "#c9c6bb" }}>•</div>
              <time style={{ color: "#74777e", fontSize: "0.95rem" }}>
                Publicado el {new Date(blog.publishedAt).toLocaleDateString("es-ES", { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            </div>
          </header>

          {blog.coverMediaAssetId && (
            <figure style={{ margin: "0 0 40px 0", position: "relative", width: "100%", height: "400px", borderRadius: "12px", overflow: "hidden", backgroundColor: "#f1f2f4" }}>
              <Image
                src={getDeliveryUrl(blog.coverMediaAssetId, 1200)}
                alt={blog.coverAltText || blog.title}
                fill
                sizes="(max-width: 800px) 100vw, 800px"
                style={{ objectFit: "cover" }}
                priority
                unoptimized
              />
            </figure>
          )}

          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.1rem", lineHeight: 1.8 }}>
            <MarkdownRenderer content={blog.contentMarkdown} mediaMap={mediaMap} />
          </div>
        </article>

      </div>
    </main>
  );
}
