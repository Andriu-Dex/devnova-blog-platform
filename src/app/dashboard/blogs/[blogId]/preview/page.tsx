import { requireAuthorOrAdmin } from "@/server/auth/authorization";
import { getBlogPreview } from "@/server/blogs/blog-service";
import { PrivateHeader } from "@/components/layout/private-header";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "@/app/blogs/[slug]/slug.module.css";
import { BlogPreviewClient } from "@/components/blogs/blog-preview-client";

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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <PrivateHeader displayName={user.displayName} role={user.role} />

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ backgroundColor: "#fef3c7", padding: "12px", textAlign: "center", color: "#92400e", fontWeight: "bold", borderBottom: "1px solid #fde68a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ flex: 1 }}>VISTA PREVIA — Esta versión LATEST no necesariamente está publicada.</div>
          <Link href={`/dashboard/blogs/${blog.id}/edit`} style={{ padding: "6px 12px", backgroundColor: "#f59e0b", color: "#fff", borderRadius: "4px", textDecoration: "none", fontSize: "0.85rem" }}>
            ← Volver al Editor
          </Link>
        </div>

        <div style={{ flex: 1, position: "relative" }}>
          <BlogPreviewClient 
            blog={{
              title: blog.title,
              summary: blog.summary,
              slug: blog.slug,
              contentMarkdown: blog.contentMarkdown,
              coverMediaAssetId: blog.coverMediaAssetId,
              coverAltText: blog.coverAltText,
              creatorName: blog.creatorName,
              categoryName: blog.categoryName || undefined,
              publishedAt: blog.publishedAt,
            }}
            mediaMap={mediaMap}
          />
        </div>
      </main>
    </div>
  );
}
