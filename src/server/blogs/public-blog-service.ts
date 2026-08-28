import "server-only";

import { db } from "../db";
import { blogs } from "../db/schema/blogs";
import { blogVersions } from "../db/schema/blog-versions";
import { blogPublications } from "../db/schema/blog-publications";
import { users } from "../db/schema/users";
import { blogCategories } from "../db/schema/blog-categories";
import { blogVersionMedia } from "../db/schema/blog-version-media";
import { mediaAssets } from "../db/schema/media-assets";
import { eq, desc, isNull, and, ilike, or, sql, not, SQL } from "drizzle-orm";
import { listBlogCategoriesWithPublishedCounts } from "./category-service";

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
      categoryName: blogCategories.name,
      categorySlug: blogCategories.slug,
      categoryColorClass: blogCategories.colorClass,
      coverMediaPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(blogPublications)
    .innerJoin(blogs, eq(blogPublications.blogId, blogs.id))
    .innerJoin(blogVersions, eq(blogPublications.blogVersionId, blogVersions.id))
    .innerJoin(users, eq(blogs.createdByUserId, users.id))
    .leftJoin(blogCategories, eq(blogs.categoryId, blogCategories.id))
    .leftJoin(mediaAssets, eq(blogVersions.coverMediaAssetId, mediaAssets.id))
    .where(isNull(blogs.deletedAt))
    .orderBy(desc(blogPublications.publishedAt));

  return publishedBlogs;
}

export async function listRecentPublishedBlogs(limit: number = 3) {
  const publishedBlogs = await db
    .select({
      slug: blogs.slug,
      title: blogVersions.title,
      summary: blogVersions.summary,
      coverMediaAssetId: blogVersions.coverMediaAssetId,
      coverAltText: blogVersions.coverAltText,
      publishedAt: blogPublications.publishedAt,
      creatorName: users.displayName,
      categoryName: blogCategories.name,
      categorySlug: blogCategories.slug,
      categoryColorClass: blogCategories.colorClass,
      coverMediaPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(blogPublications)
    .innerJoin(blogs, eq(blogPublications.blogId, blogs.id))
    .innerJoin(blogVersions, eq(blogPublications.blogVersionId, blogVersions.id))
    .innerJoin(users, eq(blogs.createdByUserId, users.id))
    .leftJoin(blogCategories, eq(blogs.categoryId, blogCategories.id))
    .leftJoin(mediaAssets, eq(blogVersions.coverMediaAssetId, mediaAssets.id))
    .where(isNull(blogs.deletedAt))
    .orderBy(desc(blogPublications.publishedAt))
    .limit(limit);

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
      categoryName: blogCategories.name,
      categorySlug: blogCategories.slug,
      categoryColorClass: blogCategories.colorClass,
      coverMediaPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(blogPublications)
    .innerJoin(blogs, eq(blogPublications.blogId, blogs.id))
    .innerJoin(blogVersions, eq(blogPublications.blogVersionId, blogVersions.id))
    .innerJoin(users, eq(blogs.createdByUserId, users.id))
    .leftJoin(blogCategories, eq(blogs.categoryId, blogCategories.id))
    .leftJoin(mediaAssets, eq(blogVersions.coverMediaAssetId, mediaAssets.id))
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

export async function searchPublishedBlogs(params: {
  query?: string;
  categorySlug?: string;
  page: number;
  pageSize?: number;
}) {
  const pageSize = params.pageSize || 9;
  const currentPage = Math.max(1, params.page);
  const offset = (currentPage - 1) * pageSize;

  let baseCondition: SQL<unknown> | undefined = isNull(blogs.deletedAt);

  if (params.query && params.query.trim().length > 0) {
    const term = `%${params.query.trim().slice(0, 100)}%`;
    baseCondition = and(
      baseCondition,
      or(
        ilike(blogVersions.title, term),
        ilike(blogVersions.summary, term),
        ilike(blogVersions.contentMarkdown, term)
      )
    );
  }

  if (params.categorySlug && params.categorySlug.trim().length > 0) {
    baseCondition = and(
      baseCondition,
      eq(blogCategories.slug, params.categorySlug.trim().slice(0, 80)),
      isNull(blogCategories.deletedAt)
    );
  }

  // Contar total
  const [countRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPublications)
    .innerJoin(blogs, eq(blogPublications.blogId, blogs.id))
    .innerJoin(blogVersions, eq(blogPublications.blogVersionId, blogVersions.id))
    .leftJoin(blogCategories, eq(blogs.categoryId, blogCategories.id))
    .where(baseCondition);

  const total = Number(countRes?.count || 0);
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Obtener items paginados
  const items = await db
    .select({
      slug: blogs.slug,
      title: blogVersions.title,
      summary: blogVersions.summary,
      coverMediaAssetId: blogVersions.coverMediaAssetId,
      coverAltText: blogVersions.coverAltText,
      publishedAt: blogPublications.publishedAt,
      creatorName: users.displayName,
      categoryName: blogCategories.name,
      categorySlug: blogCategories.slug,
      categoryColorClass: blogCategories.colorClass,
      coverMediaPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(blogPublications)
    .innerJoin(blogs, eq(blogPublications.blogId, blogs.id))
    .innerJoin(blogVersions, eq(blogPublications.blogVersionId, blogVersions.id))
    .innerJoin(users, eq(blogs.createdByUserId, users.id))
    .leftJoin(blogCategories, eq(blogs.categoryId, blogCategories.id))
    .leftJoin(mediaAssets, eq(blogVersions.coverMediaAssetId, mediaAssets.id))
    .where(baseCondition)
    .orderBy(desc(blogPublications.publishedAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items,
    total,
    page: currentPage,
    totalPages,
  };
}

export async function listPublishedCategoryStats() {
  const [totalRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPublications)
    .innerJoin(blogs, eq(blogPublications.blogId, blogs.id))
    .where(isNull(blogs.deletedAt));

  return {
    total: Number(totalRow?.count || 0),
    categories: await listBlogCategoriesWithPublishedCounts(),
  };
}

export async function listRelatedPublishedBlogs(params: {
  excludeBlogId: string;
  limit?: number;
}) {
  const limit = params.limit || 3;
  
  const related = await db
    .select({
      slug: blogs.slug,
      title: blogVersions.title,
      summary: blogVersions.summary,
      coverMediaAssetId: blogVersions.coverMediaAssetId,
      coverAltText: blogVersions.coverAltText,
      publishedAt: blogPublications.publishedAt,
      creatorName: users.displayName,
      categoryName: blogCategories.name,
      categorySlug: blogCategories.slug,
      categoryColorClass: blogCategories.colorClass,
      coverMediaPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(blogPublications)
    .innerJoin(blogs, eq(blogPublications.blogId, blogs.id))
    .innerJoin(blogVersions, eq(blogPublications.blogVersionId, blogVersions.id))
    .innerJoin(users, eq(blogs.createdByUserId, users.id))
    .leftJoin(blogCategories, eq(blogs.categoryId, blogCategories.id))
    .leftJoin(mediaAssets, eq(blogVersions.coverMediaAssetId, mediaAssets.id))
    .where(
      and(
        isNull(blogs.deletedAt),
        not(eq(blogs.id, params.excludeBlogId))
      )
    )
    .orderBy(desc(blogPublications.publishedAt))
    .limit(limit);

  return related;
}

export async function listPublishedBlogsForFeed(limit: number = 30) {
  const publishedBlogs = await db
    .select({
      slug: blogs.slug,
      title: blogVersions.title,
      summary: blogVersions.summary,
      publishedAt: blogPublications.publishedAt,
      creatorName: users.displayName,
      categoryName: blogCategories.name,
      categorySlug: blogCategories.slug,
      categoryColorClass: blogCategories.colorClass,
    })
    .from(blogPublications)
    .innerJoin(blogs, eq(blogPublications.blogId, blogs.id))
    .innerJoin(blogVersions, eq(blogPublications.blogVersionId, blogVersions.id))
    .innerJoin(users, eq(blogs.createdByUserId, users.id))
    .leftJoin(blogCategories, eq(blogs.categoryId, blogCategories.id))
    .where(isNull(blogs.deletedAt))
    .orderBy(desc(blogPublications.publishedAt))
    .limit(limit);

  return publishedBlogs;
}

