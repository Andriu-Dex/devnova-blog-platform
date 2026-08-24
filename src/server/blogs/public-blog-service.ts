import "server-only";

import { db } from "../db";
import { blogs } from "../db/schema/blogs";
import { blogVersions } from "../db/schema/blog-versions";
import { blogPublications } from "../db/schema/blog-publications";
import { users } from "../db/schema/users";
import { blogVersionMedia } from "../db/schema/blog-version-media";
import { mediaAssets } from "../db/schema/media-assets";
import { eq, desc, isNull, and } from "drizzle-orm";

export async function listPublishedBlogs() {
  const publishedBlogs = await db
    .select({
      slug: blogs.slug,
      title: blogVersions.title,
      summary: blogVersions.summary,
      coverMediaAssetId: blogVersions.coverMediaAssetId,
      coverAltText: blogVersions.coverAltText,
      publishedAt: blogPublications.publishedAt,
      creatorName: users.displayName,
    })
    .from(blogPublications)
    .innerJoin(blogs, eq(blogPublications.blogId, blogs.id))
    .innerJoin(blogVersions, eq(blogPublications.blogVersionId, blogVersions.id))
    .innerJoin(users, eq(blogs.createdByUserId, users.id))
    .where(isNull(blogs.deletedAt))
    .orderBy(desc(blogPublications.publishedAt));

  return publishedBlogs;
}

export async function getPublishedBlogBySlug(slug: string) {
  const result = await db
    .select({
      id: blogs.id,
      slug: blogs.slug,
      versionId: blogVersions.id,
      title: blogVersions.title,
      summary: blogVersions.summary,
      contentMarkdown: blogVersions.contentMarkdown,
      coverMediaAssetId: blogVersions.coverMediaAssetId,
      coverAltText: blogVersions.coverAltText,
      publishedAt: blogPublications.publishedAt,
      creatorName: users.displayName,
    })
    .from(blogPublications)
    .innerJoin(blogs, eq(blogPublications.blogId, blogs.id))
    .innerJoin(blogVersions, eq(blogPublications.blogVersionId, blogVersions.id))
    .innerJoin(users, eq(blogs.createdByUserId, users.id))
    .where(and(eq(blogs.slug, slug), isNull(blogs.deletedAt)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const blog = result[0];

  const media = await db
    .select({
      id: mediaAssets.id,
      publicId: mediaAssets.cloudinaryPublicId,
      width: mediaAssets.width,
      height: mediaAssets.height,
    })
    .from(blogVersionMedia)
    .innerJoin(mediaAssets, eq(blogVersionMedia.mediaAssetId, mediaAssets.id))
    .where(eq(blogVersionMedia.blogVersionId, blog.versionId));

  const mediaMap = new Map<string, typeof media[0]>();
  for (const m of media) {
    mediaMap.set(m.id, m);
  }

  // Si hay portada, también la traemos aunque no esté explícitamente en el markdown
  let coverMedia = null;
  if (blog.coverMediaAssetId) {
    const coverRes = await db
      .select({
        id: mediaAssets.id,
        publicId: mediaAssets.cloudinaryPublicId,
        width: mediaAssets.width,
        height: mediaAssets.height,
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, blog.coverMediaAssetId))
      .limit(1);
    if (coverRes.length > 0) {
      coverMedia = coverRes[0];
      mediaMap.set(coverMedia.id, coverMedia);
    }
  }

  return {
    blog,
    mediaMap,
  };
}
