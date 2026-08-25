import { requireAuthorOrAdmin } from "@/server/auth/authorization";
import { db } from "@/server/db";
import { blogs, blogVersions } from "@/server/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DuplicateBlogForm } from "./duplicate-blog-form";

export default async function DuplicateBlogPage({
  params,
}: {
  params: Promise<{ blogId: string }>;
}) {
  await requireAuthorOrAdmin();
  const { blogId } = await params;

  const blog = await db
    .select({
      id: blogs.id,
      slug: blogs.slug,
    })
    .from(blogs)
    .where(and(eq(blogs.id, blogId), isNull(blogs.deletedAt)))
    .limit(1)
    .then((res) => res[0]);

  if (!blog) {
    notFound();
  }

  const latestVersion = await db
    .select()
    .from(blogVersions)
    .where(eq(blogVersions.blogId, blogId))
    .orderBy(desc(blogVersions.versionNumber))
    .limit(1)
    .then((res) => res[0]);

  if (!latestVersion) {
    notFound();
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 16px" }}>
      <DuplicateBlogForm 
        sourceBlog={blog} 
        sourceLatestVersion={latestVersion} 
      />
    </div>
  );
}
