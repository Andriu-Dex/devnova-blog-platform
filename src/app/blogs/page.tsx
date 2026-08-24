import { listPublishedBlogs } from "@/server/blogs/public-blog-service";
import { getDeliveryUrl } from "@/server/media/cloudinary";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DevNova | Blog",
  description: "Últimas publicaciones y artículos de DevNova.",
  alternates: {
    canonical: "/blogs",
  }
};

export default async function PublicBlogsPage() {
  const blogs = await listPublishedBlogs();

  return (
    <main style={{ backgroundColor: "#fcfcfa", minHeight: "100vh", color: "#121419", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        <header style={{ marginBottom: "40px", borderBottom: "2px solid #121419", paddingBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: "2.5rem", margin: "0 0 8px 0" }}>
              DevNova <span style={{ color: "#1655f8" }}>Blog</span>
            </h1>
            <p style={{ color: "#51545a", fontSize: "1.1rem", margin: 0 }}>
              Ideas, tutoriales y novedades.
            </p>
          </div>
          <Link href="/" style={{ color: "#51545a", textDecoration: "none", fontSize: "0.9rem", fontWeight: "bold" }}>
            ← Volver al inicio
          </Link>
        </header>

        {blogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#74777e", fontSize: "1.2rem", fontStyle: "italic" }}>
            Aún no hay publicaciones disponibles.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "32px" }}>
            {blogs.map((blog) => (
              <Link href={`/blogs/${blog.slug}`} key={blog.slug} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <article
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #c9c6bb",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ position: "relative", width: "100%", height: "200px", backgroundColor: "#f1f2f4" }}>
                    {blog.coverMediaAssetId ? (
                      <Image
                        src={getDeliveryUrl(blog.coverMediaAssetId, 600)}
                        alt={blog.coverAltText || blog.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        style={{ objectFit: "cover" }}
                        unoptimized
                      />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#a8bdfa", fontSize: "3rem", fontWeight: "bold", fontFamily: "serif", fontStyle: "italic" }}>
                        D
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h2 style={{ margin: "0 0 12px 0", fontSize: "1.3rem", lineHeight: 1.3, color: "#121419" }}>
                      {blog.title}
                    </h2>
                    <p style={{ margin: "0 0 20px 0", color: "#51545a", fontSize: "0.95rem", lineHeight: 1.5, flex: 1 }}>
                      {blog.summary}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", borderTop: "1px solid #f1f2f4", paddingTop: "16px" }}>
                      <span style={{ fontSize: "0.85rem", color: "#74777e", fontWeight: 500 }}>
                        Por {blog.creatorName}
                      </span>
                      <time style={{ fontSize: "0.8rem", color: "#74777e" }}>
                        {new Date(blog.publishedAt).toLocaleDateString()}
                      </time>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
