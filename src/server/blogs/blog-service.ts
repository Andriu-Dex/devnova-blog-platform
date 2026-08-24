import "server-only";
import { db } from "../db";
import {
  blogs,
  blogVersions,
  blogPublications,
  users,
  auditEvents,
  auditBlogEvents,
  auditActionTypes,
  blogVersionMedia,
  mediaAssets,
} from "../db/schema";
import { eq, desc, and, isNull, sql } from "drizzle-orm";
import { AuthMetadata } from "../auth/types";
import { extractMediaReferences } from "./media-references";

export interface DashboardBlogItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  versionNumber: number;
  originalCreatorId: string;
  originalCreatorName: string;
  lastEditorId: string;
  lastEditorName: string;
  lastVersionDate: Date;
  published: boolean;
  publishedVersionNumber?: number;
}

// 1. listBlogsForDashboard
export async function listBlogsForDashboard(): Promise<DashboardBlogItem[]> {
  // En Drizzle para hacer subqueries o agrupar y obtener la última versión,
  // la forma más robusta sin RAW excesivo es usar un query que extrae el max(version_number) 
  // o hacer un JOIN a una CTE. 
  // Sin embargo, podemos extraer todos los blogs activos y luego sus últimas versiones, 
  // o hacerlo en una sola pasada con raw sql / subqueries.
  
  // Por simplicidad, obtenemos los blogs activos y su última versión:
  const activeBlogs = await db
    .select({
      id: blogs.id,
      slug: blogs.slug,
      createdAt: blogs.createdAt,
      creatorId: blogs.createdByUserId,
      creatorName: users.displayName,
    })
    .from(blogs)
    .innerJoin(users, eq(blogs.createdByUserId, users.id))
    .where(isNull(blogs.deletedAt))
    .orderBy(desc(blogs.createdAt));

  if (activeBlogs.length === 0) return [];

  const blogIds = activeBlogs.map((b) => b.id);

  // Obtener todas las versiones de esos blogs para sacar la última en memoria
  // o con un distinct on. Drizzle no tiene distinctOn nativo en SQLite pero en PG sí.
  const latestVersions = await db
    .select({
      id: blogVersions.id,
      blogId: blogVersions.blogId,
      versionNumber: blogVersions.versionNumber,
      title: blogVersions.title,
      summary: blogVersions.summary,
      editedByUserId: blogVersions.editedByUserId,
      editorName: users.displayName,
      createdAt: blogVersions.createdAt,
    })
    .from(blogVersions)
    .innerJoin(users, eq(blogVersions.editedByUserId, users.id))
    .where(sql`${blogVersions.blogId} IN ${blogIds}`)
    .orderBy(desc(blogVersions.versionNumber)); // Ordenar descendente para que el find encuentre la mayor

  // Publicaciones
  const publications = await db
    .select({
      blogId: blogPublications.blogId,
      versionId: blogPublications.blogVersionId,
      versionNumber: blogVersions.versionNumber,
    })
    .from(blogPublications)
    .innerJoin(blogVersions, eq(blogPublications.blogVersionId, blogVersions.id))
    .where(sql`${blogPublications.blogId} IN ${blogIds}`);

  const result: DashboardBlogItem[] = activeBlogs.map((b) => {
    const v = latestVersions.find((lv) => lv.blogId === b.id)!;
    const pub = publications.find((p) => p.blogId === b.id);

    return {
      id: b.id,
      slug: b.slug,
      title: v.title,
      summary: v.summary,
      versionNumber: v.versionNumber,
      originalCreatorId: b.creatorId,
      originalCreatorName: b.creatorName,
      lastEditorId: v.editedByUserId,
      lastEditorName: v.editorName,
      lastVersionDate: v.createdAt,
      published: !!pub,
      publishedVersionNumber: pub?.versionNumber,
    };
  });

  return result;
}

export function generateSlug(title: string): string {
  let slug = title.trim();
  // 3. Unicode normalize NFKD
  // 4. remover diacríticos
  slug = slug.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  // 5. lowercase
  slug = slug.toLowerCase();
  // 6. convertir grupos no alfanuméricos a `-`
  slug = slug.replace(/[^a-z0-9]+/g, "-");
  // 7. colapsar guiones
  slug = slug.replace(/-+/g, "-");
  // 8. quitar guiones inicial/final
  slug = slug.replace(/^-+|-+$/g, "");
  
  return slug;
}

// 2. createBlog
export async function createBlog(
  title: string,
  slugInput: string,
  summary: string,
  contentMarkdown: string,
  coverMediaAssetId: string | null,
  coverAltText: string | null,
  actorUserId: string,
  metadata: AuthMetadata
): Promise<{ blogId?: string; error?: string }> {
  const cleanTitle = title.trim();
  const cleanSummary = summary.trim();
  const cleanContent = contentMarkdown; // no destructivo, validado en action

  if (coverMediaAssetId && (!coverAltText || !coverAltText.trim())) {
    return { error: "La portada requiere texto alternativo." };
  }

  let extractedMediaIds: string[] = [];
  try {
    extractedMediaIds = extractMediaReferences(cleanContent);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Error desconocido al procesar referencias multimedia." };
  }

  const finalSlug = slugInput.trim() ? generateSlug(slugInput) : generateSlug(cleanTitle);

  if (!finalSlug) {
    return { error: "El slug generado es inválido." };
  }

  try {
    const newBlogId = await db.transaction(async (tx) => {
      const createAction = await tx
        .select({ id: auditActionTypes.id })
        .from(auditActionTypes)
        .where(eq(auditActionTypes.code, "CREATE"))
        .limit(1);

      if (!createAction.length) throw new Error("Missing CREATE catalog data.");

      const mediaToLock = Array.from(new Set([
        ...(coverMediaAssetId ? [coverMediaAssetId] : []),
        ...extractedMediaIds
      ])).sort();

      if (mediaToLock.length > 0) {
        const lockedMedia = await tx
          .select({ id: mediaAssets.id, deletedAt: mediaAssets.deletedAt })
          .from(mediaAssets)
          .where(sql`${mediaAssets.id} IN ${mediaToLock}`)
          .orderBy(mediaAssets.id)
          .for("share");

        if (lockedMedia.length !== mediaToLock.length) {
          throw new Error("MEDIA_NOT_FOUND");
        }
        for (const m of lockedMedia) {
          if (m.deletedAt !== null) {
            throw new Error("MEDIA_ARCHIVED");
          }
        }
      }

      // 1. INSERT blogs
      const [newBlog] = await tx
        .insert(blogs)
        .values({
          slug: finalSlug,
          createdByUserId: actorUserId,
          createdAt: new Date(),
        })
        .returning({ id: blogs.id });

      // 2. INSERT blog_versions (v1)
      const [newVersion] = await tx
        .insert(blogVersions)
        .values({
          blogId: newBlog.id,
          versionNumber: 1,
          title: cleanTitle,
          summary: cleanSummary,
          contentMarkdown: cleanContent,
          coverMediaAssetId: coverMediaAssetId || null,
          coverAltText: coverMediaAssetId ? coverAltText?.trim() : null,
          editedByUserId: actorUserId,
          changeSummary: "Versión inicial",
          createdAt: new Date(),
        })
        .returning({ id: blogVersions.id });

      // 2.5 INSERT blog_version_media
      if (extractedMediaIds.length > 0) {
        await tx.insert(blogVersionMedia).values(
          extractedMediaIds.map(mediaId => ({
            blogVersionId: newVersion.id,
            mediaAssetId: mediaId,
          }))
        );
      }

      // 3. INSERT audit_events
      const [audit] = await tx
        .insert(auditEvents)
        .values({
          actorUserId: actorUserId,
          actionTypeId: createAction[0].id,
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent ?? null,
        })
        .returning({ id: auditEvents.id });

      // 4. INSERT audit_blog_events
      await tx.insert(auditBlogEvents).values({
        auditEventId: audit.id,
        blogId: newBlog.id,
        previousVersionId: null,
        newVersionId: newVersion.id,
      });

      return newBlog.id;
    });

    return { blogId: newBlogId };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "MEDIA_NOT_FOUND") {
      return { error: "Una de las imágenes seleccionadas ya no existe." };
    }
    if (err instanceof Error && err.message === "MEDIA_ARCHIVED") {
      return { error: "Una de las imágenes seleccionadas ya no está disponible para nuevos contenidos." };
    }
    if (typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "23505") {
      return { error: "Ya existe un blog con ese slug." };
    }
    console.error("createBlog failed:", err);
    return { error: "No fue posible guardar el blog." };
  }
}

// 3. getBlogForEditing
export async function getBlogForEditing(blogId: string) {
  const blog = await db
    .select({
      id: blogs.id,
      slug: blogs.slug,
      deletedAt: blogs.deletedAt,
      creatorId: blogs.createdByUserId,
      creatorName: users.displayName,
    })
    .from(blogs)
    .innerJoin(users, eq(blogs.createdByUserId, users.id))
    .where(eq(blogs.id, blogId))
    .limit(1);

  if (!blog.length || blog[0].deletedAt !== null) {
    return { error: "El blog no existe." };
  }

  // max version
  const latestVersions = await db
    .select({
      id: blogVersions.id,
      versionNumber: blogVersions.versionNumber,
      title: blogVersions.title,
      summary: blogVersions.summary,
      contentMarkdown: blogVersions.contentMarkdown,
      coverMediaAssetId: blogVersions.coverMediaAssetId,
      coverAltText: blogVersions.coverAltText,
      editorId: blogVersions.editedByUserId,
      editorName: users.displayName,
      createdAt: blogVersions.createdAt,
    })
    .from(blogVersions)
    .innerJoin(users, eq(blogVersions.editedByUserId, users.id))
    .where(eq(blogVersions.blogId, blogId))
    .orderBy(desc(blogVersions.versionNumber))
    .limit(1);

  if (!latestVersions.length) {
    return { error: "El blog no tiene versiones." };
  }

  return {
    blog: blog[0],
    latestVersion: latestVersions[0],
  };
}

// 4. createBlogVersion
export async function createBlogVersion(
  blogId: string,
  baseVersionId: string,
  title: string,
  summary: string,
  contentMarkdown: string,
  coverMediaAssetId: string | null,
  coverAltText: string | null,
  changeSummary: string,
  actorUserId: string,
  metadata: AuthMetadata
): Promise<{ success?: boolean; error?: string }> {
  const cleanTitle = title.trim();
  const cleanSummary = summary.trim();
  const cleanChangeSummary = changeSummary.trim();
  
  if (coverMediaAssetId && (!coverAltText || !coverAltText.trim())) {
    return { error: "La portada requiere texto alternativo." };
  }

  let extractedMediaIds: string[] = [];
  try {
    extractedMediaIds = extractMediaReferences(contentMarkdown);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Error desconocido al procesar referencias multimedia." };
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Lock blogs row FOR UPDATE
      const lockedBlogs = await tx
        .select({
          id: blogs.id,
          deletedAt: blogs.deletedAt,
        })
        .from(blogs)
        .where(eq(blogs.id, blogId))
        .limit(1)
        .for("update");

      if (!lockedBlogs.length || lockedBlogs[0].deletedAt !== null) {
        throw new Error("NOT_FOUND");
      }

      // 2. Get latest version
      const latestVersions = await tx
        .select({
          id: blogVersions.id,
          versionNumber: blogVersions.versionNumber,
        })
        .from(blogVersions)
        .where(eq(blogVersions.blogId, blogId))
        .orderBy(desc(blogVersions.versionNumber))
        .limit(1);

      if (!latestVersions.length) {
        throw new Error("NOT_FOUND");
      }

      const latest = latestVersions[0];

      // 3. Control de concurrencia optimista
      if (latest.id !== baseVersionId) {
        throw new Error("CONCURRENCY_CONFLICT");
      }

      const mediaToLock = Array.from(new Set([
        ...(coverMediaAssetId ? [coverMediaAssetId] : []),
        ...extractedMediaIds
      ])).sort();

      if (mediaToLock.length > 0) {
        const lockedMedia = await tx
          .select({ id: mediaAssets.id, deletedAt: mediaAssets.deletedAt })
          .from(mediaAssets)
          .where(sql`${mediaAssets.id} IN ${mediaToLock}`)
          .orderBy(mediaAssets.id)
          .for("share");

        if (lockedMedia.length !== mediaToLock.length) {
          throw new Error("MEDIA_NOT_FOUND");
        }
        for (const m of lockedMedia) {
          if (m.deletedAt !== null) {
            throw new Error("MEDIA_ARCHIVED");
          }
        }
      }

      const editAction = await tx
        .select({ id: auditActionTypes.id })
        .from(auditActionTypes)
        .where(eq(auditActionTypes.code, "EDIT"))
        .limit(1);

      if (!editAction.length) throw new Error("Missing EDIT catalog data.");

      // 4. Insert new version
      const [newVersion] = await tx
        .insert(blogVersions)
        .values({
          blogId: blogId,
          versionNumber: latest.versionNumber + 1,
          title: cleanTitle,
          summary: cleanSummary,
          contentMarkdown: contentMarkdown,
          editedByUserId: actorUserId,
          changeSummary: cleanChangeSummary,
          coverMediaAssetId: coverMediaAssetId || null,
          coverAltText: coverMediaAssetId ? coverAltText?.trim() : null,
          createdAt: new Date(),
        })
        .returning({ id: blogVersions.id });

      // Insert media links
      if (extractedMediaIds.length > 0) {
        await tx.insert(blogVersionMedia).values(
          extractedMediaIds.map(mediaId => ({
            blogVersionId: newVersion.id,
            mediaAssetId: mediaId,
          }))
        );
      }

      // 5. Audit
      const [audit] = await tx
        .insert(auditEvents)
        .values({
          actorUserId: actorUserId,
          actionTypeId: editAction[0].id,
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent ?? null,
        })
        .returning({ id: auditEvents.id });

      await tx.insert(auditBlogEvents).values({
        auditEventId: audit.id,
        blogId: blogId,
        previousVersionId: latest.id,
        newVersionId: newVersion.id,
      });
    });

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "MEDIA_NOT_FOUND") {
      return { error: "Una de las imágenes seleccionadas ya no existe." };
    }
    if (err instanceof Error && err.message === "MEDIA_ARCHIVED") {
      return { error: "Una de las imágenes seleccionadas ya no está disponible para nuevos contenidos." };
    }
    if (err instanceof Error && err.message === "CONCURRENCY_CONFLICT") {
      return { error: "Este blog fue modificado por otra persona mientras lo editabas. Recarga la página antes de guardar." };
    }
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return { error: "El blog no existe." };
    }
    console.error("createBlogVersion failed:", err);
    return { error: "No fue posible guardar el blog." };
  }
}

// 5. getBlogHistory
export async function getBlogHistory(blogId: string) {
  const blog = await db
    .select({
      id: blogs.id,
      slug: blogs.slug,
      deletedAt: blogs.deletedAt,
    })
    .from(blogs)
    .where(eq(blogs.id, blogId))
    .limit(1);

  if (!blog.length || blog[0].deletedAt !== null) {
    return { error: "El blog no existe." };
  }

  const versions = await db
    .select({
      id: blogVersions.id,
      versionNumber: blogVersions.versionNumber,
      title: blogVersions.title,
      summary: blogVersions.summary,
      changeSummary: blogVersions.changeSummary,
      editorName: users.displayName,
      createdAt: blogVersions.createdAt,
      restoredFromVersionId: blogVersions.restoredFromVersionId,
      coverMediaAssetId: blogVersions.coverMediaAssetId,
    })
    .from(blogVersions)
    .innerJoin(users, eq(blogVersions.editedByUserId, users.id))
    .where(eq(blogVersions.blogId, blogId))
    .orderBy(desc(blogVersions.versionNumber));

  if (!versions.length) {
    return { error: "El blog no tiene versiones." };
  }

  const publications = await db
    .select({
      versionId: blogPublications.blogVersionId,
    })
    .from(blogPublications)
    .where(eq(blogPublications.blogId, blogId))
    .limit(1);

  const publishedVersionId = publications.length ? publications[0].versionId : null;
  const latestVersionId = versions[0].id; // first in DESC order

  // Mapear restored_from_version_id a restoredFromVersionNumber
  const mappedVersions = versions.map((v) => {
    let restoredFromVersionNumber: number | undefined;
    if (v.restoredFromVersionId) {
      const source = versions.find((sv) => sv.id === v.restoredFromVersionId);
      if (source) restoredFromVersionNumber = source.versionNumber;
    }
    return {
      id: v.id,
      versionNumber: v.versionNumber,
      title: v.title,
      summary: v.summary,
      changeSummary: v.changeSummary,
      editorName: v.editorName,
      createdAt: v.createdAt,
      restoredFromVersionNumber,
      isPublished: v.id === publishedVersionId,
      isLatest: v.id === latestVersionId,
      hasCover: v.coverMediaAssetId !== null,
    };
  });

  return { blog: blog[0], history: mappedVersions };
}

// 6. publishBlog
export async function publishBlog(blogId: string, actorUserId: string, metadata: AuthMetadata) {
  try {
    await db.transaction(async (tx) => {
      // 1. Lock blog
      const lockedBlogs = await tx
        .select({ deletedAt: blogs.deletedAt })
        .from(blogs)
        .where(eq(blogs.id, blogId))
        .limit(1)
        .for("update");

      if (!lockedBlogs.length || lockedBlogs[0].deletedAt !== null) {
        throw new Error("NOT_FOUND");
      }

      // 2. Get latest version
      const latestVersions = await tx
        .select({ id: blogVersions.id })
        .from(blogVersions)
        .where(eq(blogVersions.blogId, blogId))
        .orderBy(desc(blogVersions.versionNumber))
        .limit(1);

      if (!latestVersions.length) throw new Error("NOT_FOUND");
      const latest = latestVersions[0];

      // 3. Get current publication
      const currentPubs = await tx
        .select({ versionId: blogPublications.blogVersionId })
        .from(blogPublications)
        .where(eq(blogPublications.blogId, blogId))
        .limit(1);

      if (currentPubs.length && currentPubs[0].versionId === latest.id) {
        // Ya está publicada la última versión
        throw new Error("ALREADY_PUBLISHED");
      }

      const publishAction = await tx
        .select({ id: auditActionTypes.id })
        .from(auditActionTypes)
        .where(eq(auditActionTypes.code, "PUBLISH"))
        .limit(1);
      
      if (!publishAction.length) throw new Error("Missing PUBLISH action type");

      if (!currentPubs.length) {
        // Insert
        await tx.insert(blogPublications).values({
          blogId,
          blogVersionId: latest.id,
          publishedByUserId: actorUserId,
          publishedAt: new Date(),
        });
        
        const [audit] = await tx.insert(auditEvents).values({
          actorUserId,
          actionTypeId: publishAction[0].id,
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent ?? null,
        }).returning({ id: auditEvents.id });

        await tx.insert(auditBlogEvents).values({
          auditEventId: audit.id,
          blogId,
          previousVersionId: null,
          newVersionId: latest.id,
        });
      } else {
        // Update
        const previousVersionId = currentPubs[0].versionId;
        await tx
          .update(blogPublications)
          .set({
            blogVersionId: latest.id,
            publishedByUserId: actorUserId,
            publishedAt: new Date(),
          })
          .where(eq(blogPublications.blogId, blogId));
        
        const [audit] = await tx.insert(auditEvents).values({
          actorUserId,
          actionTypeId: publishAction[0].id,
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent ?? null,
        }).returning({ id: auditEvents.id });

        await tx.insert(auditBlogEvents).values({
          auditEventId: audit.id,
          blogId,
          previousVersionId: previousVersionId,
          newVersionId: latest.id,
        });
      }
    });
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "ALREADY_PUBLISHED") return { error: "El blog ya está publicado en su versión más reciente." };
    if (err instanceof Error && err.message === "NOT_FOUND") return { error: "El blog no existe." };
    console.error("publishBlog error:", err);
    return { error: "No fue posible completar la operación." };
  }
}

// 7. unpublishBlog
export async function unpublishBlog(blogId: string, actorUserId: string, metadata: AuthMetadata) {
  try {
    await db.transaction(async (tx) => {
      // 1. Lock blog
      const lockedBlogs = await tx
        .select({ deletedAt: blogs.deletedAt })
        .from(blogs)
        .where(eq(blogs.id, blogId))
        .limit(1)
        .for("update");

      if (!lockedBlogs.length || lockedBlogs[0].deletedAt !== null) {
        throw new Error("NOT_FOUND");
      }

      // 2. Get current publication
      const currentPubs = await tx
        .select({ versionId: blogPublications.blogVersionId })
        .from(blogPublications)
        .where(eq(blogPublications.blogId, blogId))
        .limit(1);

      if (!currentPubs.length) {
        // No está publicado
        throw new Error("NOT_PUBLISHED");
      }

      const publishedVersionId = currentPubs[0].versionId;

      const unpublishAction = await tx
        .select({ id: auditActionTypes.id })
        .from(auditActionTypes)
        .where(eq(auditActionTypes.code, "UNPUBLISH"))
        .limit(1);
      
      if (!unpublishAction.length) throw new Error("Missing UNPUBLISH action type");

      // 3. Delete publication
      await tx.delete(blogPublications).where(eq(blogPublications.blogId, blogId));

      // 4. Audit
      const [audit] = await tx.insert(auditEvents).values({
        actorUserId,
        actionTypeId: unpublishAction[0].id,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      }).returning({ id: auditEvents.id });

      await tx.insert(auditBlogEvents).values({
        auditEventId: audit.id,
        blogId,
        previousVersionId: publishedVersionId,
        newVersionId: null,
      });
    });
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_PUBLISHED") return { error: "El blog ya está despublicado." };
    if (err instanceof Error && err.message === "NOT_FOUND") return { error: "El blog no existe." };
    console.error("unpublishBlog error:", err);
    return { error: "No fue posible completar la operación." };
  }
}

// 8. restoreBlogVersion
export async function restoreBlogVersion(
  blogId: string,
  sourceVersionId: string,
  reason: string,
  actorUserId: string,
  metadata: AuthMetadata
) {
  const cleanReason = reason.trim();
  try {
    await db.transaction(async (tx) => {
      // 1. Lock blog
      const lockedBlogs = await tx
        .select({ deletedAt: blogs.deletedAt })
        .from(blogs)
        .where(eq(blogs.id, blogId))
        .limit(1)
        .for("update");

      if (!lockedBlogs.length || lockedBlogs[0].deletedAt !== null) {
        throw new Error("NOT_FOUND");
      }

      // 2. Validate source version belongs to blog
      const sourceVersions = await tx
        .select()
        .from(blogVersions)
        .where(and(eq(blogVersions.id, sourceVersionId), eq(blogVersions.blogId, blogId)))
        .limit(1);
      
      if (!sourceVersions.length) throw new Error("INVALID_VERSION");
      const sourceVersion = sourceVersions[0];

      // 3. Get latest
      const latestVersions = await tx
        .select({ id: blogVersions.id, versionNumber: blogVersions.versionNumber })
        .from(blogVersions)
        .where(eq(blogVersions.blogId, blogId))
        .orderBy(desc(blogVersions.versionNumber))
        .limit(1);

      if (!latestVersions.length) throw new Error("NOT_FOUND");
      const latest = latestVersions[0];

      if (sourceVersion.id === latest.id) {
        throw new Error("ALREADY_LATEST");
      }

      const restoreAction = await tx
        .select({ id: auditActionTypes.id })
        .from(auditActionTypes)
        .where(eq(auditActionTypes.code, "RESTORE"))
        .limit(1);
      
      if (!restoreAction.length) throw new Error("Missing RESTORE action type");

      // 4. Create new version
      const [newVersion] = await tx
        .insert(blogVersions)
        .values({
          blogId,
          versionNumber: latest.versionNumber + 1,
          title: sourceVersion.title,
          summary: sourceVersion.summary,
          contentMarkdown: sourceVersion.contentMarkdown,
          coverMediaAssetId: sourceVersion.coverMediaAssetId,
          coverAltText: sourceVersion.coverAltText,
          editedByUserId: actorUserId,
          changeSummary: cleanReason,
          restoredFromVersionId: sourceVersion.id,
          createdAt: new Date(),
        })
        .returning({ id: blogVersions.id });

      // 5. Copy blog_version_media
      const oldMedia = await tx
        .select({ mediaAssetId: blogVersionMedia.mediaAssetId })
        .from(blogVersionMedia)
        .where(eq(blogVersionMedia.blogVersionId, sourceVersion.id));
      
      if (oldMedia.length > 0) {
        await tx.insert(blogVersionMedia).values(
          oldMedia.map((om) => ({
            blogVersionId: newVersion.id,
            mediaAssetId: om.mediaAssetId,
          }))
        );
      }

      // 6. Audit
      const [audit] = await tx.insert(auditEvents).values({
        actorUserId,
        actionTypeId: restoreAction[0].id,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      }).returning({ id: auditEvents.id });

      await tx.insert(auditBlogEvents).values({
        auditEventId: audit.id,
        blogId,
        previousVersionId: latest.id,
        newVersionId: newVersion.id,
      });
    });
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "ALREADY_LATEST") return { error: "La versión seleccionada ya es la versión actual." };
    if (err instanceof Error && err.message === "INVALID_VERSION") return { error: "La versión seleccionada no pertenece a este blog." };
    if (err instanceof Error && err.message === "NOT_FOUND") return { error: "El blog no existe." };
    console.error("restoreBlogVersion error:", err);
    return { error: "No fue posible completar la operación." };
  }
}

// 9. deleteBlog
export async function deleteBlog(blogId: string, actorUserId: string, metadata: AuthMetadata) {
  try {
    await db.transaction(async (tx) => {
      // 1. Lock blog
      const lockedBlogs = await tx
        .select({ deletedAt: blogs.deletedAt })
        .from(blogs)
        .where(eq(blogs.id, blogId))
        .limit(1)
        .for("update");

      if (!lockedBlogs.length) throw new Error("NOT_FOUND");
      if (lockedBlogs[0].deletedAt !== null) return; // Already deleted

      const deleteAction = await tx
        .select({ id: auditActionTypes.id })
        .from(auditActionTypes)
        .where(eq(auditActionTypes.code, "DELETE"))
        .limit(1);
      if (!deleteAction.length) throw new Error("Missing DELETE action type");

      // 2. Unpublish if published
      const currentPubs = await tx
        .select({ versionId: blogPublications.blogVersionId })
        .from(blogPublications)
        .where(eq(blogPublications.blogId, blogId))
        .limit(1);

      if (currentPubs.length) {
        const unpublishAction = await tx
          .select({ id: auditActionTypes.id })
          .from(auditActionTypes)
          .where(eq(auditActionTypes.code, "UNPUBLISH"))
          .limit(1);
        
        await tx.delete(blogPublications).where(eq(blogPublications.blogId, blogId));
        
        const [auditUnpub] = await tx.insert(auditEvents).values({
          actorUserId,
          actionTypeId: unpublishAction[0].id,
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent ?? null,
        }).returning({ id: auditEvents.id });

        await tx.insert(auditBlogEvents).values({
          auditEventId: auditUnpub.id,
          blogId,
          previousVersionId: currentPubs[0].versionId,
          newVersionId: null,
        });
      }

      // 3. Update deletedAt
      await tx.update(blogs).set({ deletedAt: new Date() }).where(eq(blogs.id, blogId));

      // 4. Audit Delete
      const [auditDel] = await tx.insert(auditEvents).values({
        actorUserId,
        actionTypeId: deleteAction[0].id,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      }).returning({ id: auditEvents.id });

      await tx.insert(auditBlogEvents).values({
        auditEventId: auditDel.id,
        blogId,
        previousVersionId: null,
        newVersionId: null,
      });
    });
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") return { error: "El blog no existe." };
    console.error("deleteBlog error:", err);
    return { error: "No fue posible completar la operación." };
  }
}

// 10. recoverBlog
export async function recoverBlog(blogId: string, actorUserId: string, metadata: AuthMetadata) {
  try {
    await db.transaction(async (tx) => {
      // 1. Lock blog
      const lockedBlogs = await tx
        .select({ deletedAt: blogs.deletedAt })
        .from(blogs)
        .where(eq(blogs.id, blogId))
        .limit(1)
        .for("update");

      if (!lockedBlogs.length) throw new Error("NOT_FOUND");
      if (lockedBlogs[0].deletedAt === null) return; // Already recovered

      const recoverAction = await tx
        .select({ id: auditActionTypes.id })
        .from(auditActionTypes)
        .where(eq(auditActionTypes.code, "RECOVER"))
        .limit(1);
      if (!recoverAction.length) throw new Error("Missing RECOVER action type");

      // 2. Update deletedAt
      await tx.update(blogs).set({ deletedAt: null }).where(eq(blogs.id, blogId));

      // 3. Audit Recover
      const [auditRec] = await tx.insert(auditEvents).values({
        actorUserId,
        actionTypeId: recoverAction[0].id,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
      }).returning({ id: auditEvents.id });

      await tx.insert(auditBlogEvents).values({
        auditEventId: auditRec.id,
        blogId,
        previousVersionId: null,
        newVersionId: null,
      });
    });
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NOT_FOUND") return { error: "El blog no existe." };
    console.error("recoverBlog error:", err);
    return { error: "No fue posible completar la operación." };
  }
}

// 11. listDeletedBlogs
export async function listDeletedBlogs() {
  const deletedBlogs = await db
    .select({
      id: blogs.id,
      slug: blogs.slug,
      deletedAt: blogs.deletedAt,
      creatorName: users.displayName,
    })
    .from(blogs)
    .innerJoin(users, eq(blogs.createdByUserId, users.id))
    .where(sql`${blogs.deletedAt} IS NOT NULL`)
    .orderBy(desc(blogs.deletedAt));

  if (deletedBlogs.length === 0) return [];
  const blogIds = deletedBlogs.map((b) => b.id);

  const latestVersions = await db
    .select({
      blogId: blogVersions.blogId,
      versionNumber: blogVersions.versionNumber,
      title: blogVersions.title,
    })
    .from(blogVersions)
    .where(sql`${blogVersions.blogId} IN ${blogIds}`)
    .orderBy(desc(blogVersions.versionNumber));

  return deletedBlogs.map((b) => {
    const v = latestVersions.find((lv) => lv.blogId === b.id)!;
    return {
      id: b.id,
      slug: b.slug,
      title: v.title,
      versionNumber: v.versionNumber,
      creatorName: b.creatorName,
      deletedAt: b.deletedAt!,
    };
  });
}
