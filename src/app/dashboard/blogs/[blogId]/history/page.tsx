import { requireAuthorOrAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { getBlogHistory } from "@/server/blogs/blog-service";
import styles from "../../blogs.module.css";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoryClient } from "./history-client";

export const metadata: Metadata = {
  title: "Historial de Blog | DevNova",
};

export default async function BlogHistoryPage({
  params,
}: {
  params: Promise<{ blogId: string }>;
}) {
  const user = await requireAuthorOrAdmin();
  const { blogId } = await params;
  
  const result = await getBlogHistory(blogId);
  if (result.error || !result.blog) {
    notFound();
  }

  const { blog, history } = result;
  
  // Encontrar si hay alguna versión publicada
  const publishedVersion = history.find(v => v.isPublished);
  // La primera en la lista es la latest
  const latestVersion = history[0];
  
  const canPublish = latestVersion && !latestVersion.isPublished;
  const canUnpublish = !!publishedVersion;

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Historial: {blog.slug}</h1>
          <Link href="/dashboard/blogs" className={styles.subtitle}>
            ← Volver a Blogs
          </Link>
        </div>
        <HistoryClient 
          blogId={blog.id} 
          canPublish={canPublish} 
          canUnpublish={canUnpublish} 
          history={history}
        />
      </div>

    </main>
  );
}
