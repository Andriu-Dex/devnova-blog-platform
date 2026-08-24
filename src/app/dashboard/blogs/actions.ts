"use server";

import { requireAuthorOrAdmin, requireAdmin } from "@/server/auth/authorization";
import { 
  createBlog, 
  createBlogVersion,
  publishBlog,
  unpublishBlog,
  restoreBlogVersion,
  deleteBlog,
  recoverBlog,
} from "@/server/blogs/blog-service";
import { headers } from "next/headers";
import net from "node:net";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function getMetadata() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  let ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : headersList.get("x-real-ip") || null;
  if (ipAddress && !net.isIP(ipAddress)) {
    ipAddress = null;
  }
  let userAgent = headersList.get("user-agent") || null;
  if (userAgent && userAgent.length > 1024) {
    userAgent = userAgent.substring(0, 1024);
  }
  return { ipAddress, userAgent };
}

export async function createBlogAction(prevState: unknown, formData: FormData) {
  const user = await requireAuthorOrAdmin();

  const title = formData.get("title");
  const slug = formData.get("slug");
  const summary = formData.get("summary");
  const contentMarkdown = formData.get("contentMarkdown");

  if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
    return { error: "El título es requerido y debe tener máximo 200 caracteres." };
  }
  
  if (typeof slug !== "string" || slug.trim().length > 180) {
    return { error: "El slug no debe exceder 180 caracteres." };
  }
  
  if (typeof summary !== "string" || !summary.trim() || summary.trim().length > 500) {
    return { error: "El resumen es requerido y debe tener máximo 500 caracteres." };
  }
  
  if (typeof contentMarkdown !== "string" || !contentMarkdown.trim()) {
    return { error: "El contenido es requerido." };
  }

  const coverMediaAssetId = formData.get("coverMediaAssetId") as string | null || null;
  const coverAltText = formData.get("coverAltText") as string | null || null;

  const metadata = await getMetadata();
  const result = await createBlog(title, slug, summary, contentMarkdown, coverMediaAssetId, coverAltText, user.id, metadata);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/blogs");
  redirect(`/dashboard/blogs/${result.blogId}/edit`);
}

export async function editBlogAction(prevState: unknown, formData: FormData) {
  const user = await requireAuthorOrAdmin();

  const blogId = formData.get("blogId");
  const baseVersionId = formData.get("baseVersionId");
  const title = formData.get("title");
  const summary = formData.get("summary");
  const contentMarkdown = formData.get("contentMarkdown");
  const changeSummary = formData.get("changeSummary");

  if (typeof blogId !== "string" || !blogId) {
    return { error: "ID de blog inválido." };
  }
  if (typeof baseVersionId !== "string" || !baseVersionId) {
    return { error: "Versión base inválida." };
  }

  if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
    return { error: "El título es requerido y debe tener máximo 200 caracteres." };
  }
  if (typeof summary !== "string" || !summary.trim() || summary.trim().length > 500) {
    return { error: "El resumen es requerido y debe tener máximo 500 caracteres." };
  }
  if (typeof contentMarkdown !== "string" || !contentMarkdown.trim()) {
    return { error: "El contenido es requerido." };
  }
  if (typeof changeSummary !== "string" || !changeSummary.trim() || changeSummary.trim().length > 500) {
    return { error: "El resumen del cambio es requerido y debe tener máximo 500 caracteres." };
  }

  const coverMediaAssetId = formData.get("coverMediaAssetId") as string | null || null;
  const coverAltText = formData.get("coverAltText") as string | null || null;

  const metadata = await getMetadata();
  const result = await createBlogVersion(
    blogId,
    baseVersionId,
    title,
    summary,
    contentMarkdown,
    coverMediaAssetId,
    coverAltText,
    changeSummary,
    user.id,
    metadata
  );

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/dashboard/blogs`);
  revalidatePath(`/dashboard/blogs/${blogId}/edit`);
  return { success: "El blog ha sido actualizado exitosamente." };
}

export async function publishBlogAction(blogId: string) {
  const user = await requireAuthorOrAdmin();
  if (typeof blogId !== "string" || !blogId) return { error: "ID de blog inválido." };
  
  const metadata = await getMetadata();
  const result = await publishBlog(blogId, user.id, metadata);
  if (result.error) return { error: result.error };

  revalidatePath(`/dashboard/blogs`);
  revalidatePath(`/dashboard/blogs/${blogId}/history`);
  return { success: "El blog ha sido publicado exitosamente." };
}

export async function unpublishBlogAction(blogId: string) {
  const user = await requireAuthorOrAdmin();
  if (typeof blogId !== "string" || !blogId) return { error: "ID de blog inválido." };
  
  const metadata = await getMetadata();
  const result = await unpublishBlog(blogId, user.id, metadata);
  if (result.error) return { error: result.error };

  revalidatePath(`/dashboard/blogs`);
  revalidatePath(`/dashboard/blogs/${blogId}/history`);
  return { success: "El blog ha sido despublicado exitosamente." };
}

export async function restoreBlogAction(prevState: unknown, formData: FormData) {
  const user = await requireAuthorOrAdmin();

  const blogId = formData.get("blogId");
  const sourceVersionId = formData.get("sourceVersionId");
  const reason = formData.get("reason");

  if (typeof blogId !== "string" || !blogId) return { error: "ID de blog inválido." };
  if (typeof sourceVersionId !== "string" || !sourceVersionId) return { error: "ID de versión inválido." };
  if (typeof reason !== "string" || !reason.trim() || reason.trim().length > 500) {
    return { error: "El motivo es requerido y debe tener máximo 500 caracteres." };
  }

  const metadata = await getMetadata();
  const result = await restoreBlogVersion(blogId, sourceVersionId, reason, user.id, metadata);
  if (result.error) return { error: result.error };

  revalidatePath(`/dashboard/blogs`);
  revalidatePath(`/dashboard/blogs/${blogId}/history`);
  redirect(`/dashboard/blogs/${blogId}/history`);
}

export async function deleteBlogAction(blogId: string) {
  const user = await requireAdmin();
  if (typeof blogId !== "string" || !blogId) return { error: "ID de blog inválido." };

  const metadata = await getMetadata();
  const result = await deleteBlog(blogId, user.id, metadata);
  if (result.error) return { error: result.error };

  revalidatePath(`/dashboard/blogs`);
  revalidatePath(`/admin/blogs/trash`);
  return { success: "El blog ha sido movido a la papelera exitosamente." };
}

export async function recoverBlogAction(blogId: string) {
  const user = await requireAdmin();
  if (typeof blogId !== "string" || !blogId) return { error: "ID de blog inválido." };

  const metadata = await getMetadata();
  const result = await recoverBlog(blogId, user.id, metadata);
  if (result.error) return { error: result.error };

  revalidatePath(`/dashboard/blogs`);
  revalidatePath(`/admin/blogs/trash`);
  return { success: "El blog ha sido recuperado exitosamente." };
}
