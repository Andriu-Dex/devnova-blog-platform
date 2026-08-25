import "server-only";

import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import { blogCategories, blogPublications, blogs } from "../db/schema";

export interface BlogCategoryItem {
  id: string;
  name: string;
  slug: string;
  colorClass: string | null;
  displayOrder: number;
  createdAt: Date;
}

export interface BlogCategoryWithCount extends BlogCategoryItem {
  publishedCount: number;
}

export function generateCategorySlug(name: string): string {
  return name
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listActiveBlogCategories(): Promise<BlogCategoryItem[]> {
  return await db
    .select({
      id: blogCategories.id,
      name: blogCategories.name,
      slug: blogCategories.slug,
      colorClass: blogCategories.colorClass,
      displayOrder: blogCategories.displayOrder,
      createdAt: blogCategories.createdAt,
    })
    .from(blogCategories)
    .where(isNull(blogCategories.deletedAt))
    .orderBy(asc(blogCategories.displayOrder), asc(blogCategories.name));
}

export async function listBlogCategoriesWithPublishedCounts(): Promise<BlogCategoryWithCount[]> {
  const rows = await db
    .select({
      id: blogCategories.id,
      name: blogCategories.name,
      slug: blogCategories.slug,
      colorClass: blogCategories.colorClass,
      displayOrder: blogCategories.displayOrder,
      createdAt: blogCategories.createdAt,
      publishedCount: sql<number>`count(${blogPublications.blogId})`,
    })
    .from(blogCategories)
    .leftJoin(
      blogs,
      and(eq(blogs.categoryId, blogCategories.id), isNull(blogs.deletedAt))
    )
    .leftJoin(blogPublications, eq(blogPublications.blogId, blogs.id))
    .where(isNull(blogCategories.deletedAt))
    .groupBy(
      blogCategories.id,
      blogCategories.name,
      blogCategories.slug,
      blogCategories.colorClass,
      blogCategories.displayOrder,
      blogCategories.createdAt
    )
    .orderBy(asc(blogCategories.displayOrder), asc(blogCategories.name));

  return rows.map((row) => ({
    ...row,
    publishedCount: Number(row.publishedCount || 0),
  }));
}

export async function getBlogCategoryById(categoryId: string) {
  const rows = await db
    .select({
      id: blogCategories.id,
      name: blogCategories.name,
      slug: blogCategories.slug,
      colorClass: blogCategories.colorClass,
      displayOrder: blogCategories.displayOrder,
      createdAt: blogCategories.createdAt,
      deletedAt: blogCategories.deletedAt,
    })
    .from(blogCategories)
    .where(eq(blogCategories.id, categoryId))
    .limit(1);

  if (!rows.length || rows[0].deletedAt !== null) {
    return { error: "La categoría no existe." };
  }

  return { category: rows[0] };
}

export async function assertActiveCategory(categoryId: string | null) {
  if (!categoryId) return { categoryId: null };

  const rows = await db
    .select({ id: blogCategories.id })
    .from(blogCategories)
    .where(and(eq(blogCategories.id, categoryId), isNull(blogCategories.deletedAt)))
    .limit(1);

  if (!rows.length) {
    return { error: "La categoría seleccionada no existe o fue eliminada." };
  }

  return { categoryId };
}

export async function createBlogCategory(params: {
  name: string;
  slug?: string;
  colorClass?: string | null;
  displayOrder?: number;
}) {
  const name = params.name.trim();
  const slug = params.slug?.trim() ? generateCategorySlug(params.slug) : generateCategorySlug(name);
  const colorClass = params.colorClass?.trim() || null;
  const displayOrder = params.displayOrder ?? 0;

  if (!name || name.length > 80) {
    return { error: "El nombre es requerido y debe tener máximo 80 caracteres." };
  }
  if (!slug || slug.length > 80) {
    return { error: "El slug generado es inválido." };
  }
  if (colorClass && colorClass.length > 40) {
    return { error: "La clase de color debe tener máximo 40 caracteres." };
  }

  try {
    const [created] = await db
      .insert(blogCategories)
      .values({ name, slug, colorClass, displayOrder })
      .returning({ id: blogCategories.id });

    return { categoryId: created.id };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505") {
      return { error: "Ya existe una categoría con ese slug." };
    }
    console.error("createBlogCategory failed:", err);
    return { error: "No fue posible crear la categoría." };
  }
}

export async function updateBlogCategory(params: {
  id: string;
  name: string;
  slug?: string;
  colorClass?: string | null;
  displayOrder?: number;
}) {
  const name = params.name.trim();
  const slug = params.slug?.trim() ? generateCategorySlug(params.slug) : generateCategorySlug(name);
  const colorClass = params.colorClass?.trim() || null;
  const displayOrder = params.displayOrder ?? 0;

  if (!name || name.length > 80) {
    return { error: "El nombre es requerido y debe tener máximo 80 caracteres." };
  }
  if (!slug || slug.length > 80) {
    return { error: "El slug generado es inválido." };
  }
  if (colorClass && colorClass.length > 40) {
    return { error: "La clase de color debe tener máximo 40 caracteres." };
  }

  try {
    const updated = await db
      .update(blogCategories)
      .set({ name, slug, colorClass, displayOrder })
      .where(and(eq(blogCategories.id, params.id), isNull(blogCategories.deletedAt)))
      .returning({ id: blogCategories.id });

    if (!updated.length) {
      return { error: "La categoría no existe." };
    }

    return { success: true };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505") {
      return { error: "Ya existe una categoría con ese slug." };
    }
    console.error("updateBlogCategory failed:", err);
    return { error: "No fue posible actualizar la categoría." };
  }
}

export async function deleteBlogCategory(categoryId: string) {
  const activeBlogs = await db
    .select({ id: blogs.id })
    .from(blogs)
    .where(and(eq(blogs.categoryId, categoryId), isNull(blogs.deletedAt)))
    .limit(1);

  if (activeBlogs.length > 0) {
    return { error: "No puedes eliminar una categoría asignada a blogs activos." };
  }

  const updated = await db
    .update(blogCategories)
    .set({ deletedAt: new Date() })
    .where(and(eq(blogCategories.id, categoryId), isNull(blogCategories.deletedAt)))
    .returning({ id: blogCategories.id });

  if (!updated.length) {
    return { error: "La categoría no existe." };
  }

  return { success: true };
}
