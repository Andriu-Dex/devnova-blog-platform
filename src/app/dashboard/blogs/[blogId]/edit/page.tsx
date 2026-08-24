import { requireAuthorOrAdmin } from "@/server/auth/authorization";
import { PrivateHeader } from "@/components/layout/private-header";
import { getBlogForEditing } from "@/server/blogs/blog-service";
import { listActiveMedia } from "@/server/media/media-service";
import { EditBlogForm } from "./edit-blog-form";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Editar Blog | DevNova",
  description: "Edita una entrada de blog",
};

export default async function EditBlogPage({ params }: { params: Promise<{ blogId: string }> }) {
  const user = await requireAuthorOrAdmin();
  const resolvedParams = await params;
  
  const result = await getBlogForEditing(resolvedParams.blogId);
  const mediaList = await listActiveMedia();

  if (result.error || !result.blog || !result.latestVersion) {
    notFound();
  }

  return (
    <main>
      <PrivateHeader displayName={user.displayName} role={user.role} />
      <EditBlogForm blog={result.blog} latestVersion={result.latestVersion} mediaList={mediaList} />
    </main>
  );
}
