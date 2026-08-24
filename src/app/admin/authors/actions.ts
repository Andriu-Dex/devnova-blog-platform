"use server";

import { requireAdmin } from "@/server/auth/authorization";
import {
  createAuthor,
  blockAuthor,
  reactivateAuthor,
  resetAuthorTemporaryPassword
} from "@/server/users/author-service";
import { headers } from "next/headers";
import net from "node:net";
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

export async function createAuthorAction(prevState: unknown, formData: FormData) {
  const username = formData.get("username");
  const displayName = formData.get("displayName");

  if (typeof username !== "string" || !username.trim()) {
    return { error: "El nombre de usuario es requerido." };
  }
  if (typeof displayName !== "string" || !displayName.trim()) {
    return { error: "El nombre para mostrar es requerido." };
  }

  const admin = await requireAdmin();
  const metadata = await getMetadata();

  const result = await createAuthor(username, displayName, admin.id, metadata);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/authors");
  return { temporaryPassword: result.temporaryPassword };
}

export async function blockAuthorAction(prevState: unknown, formData: FormData) {
  const targetUserId = formData.get("targetUserId");

  if (typeof targetUserId !== "string" || !targetUserId) {
    return { error: "ID de usuario inválido." };
  }

  const admin = await requireAdmin();
  const metadata = await getMetadata();

  const result = await blockAuthor(targetUserId, admin.id, metadata);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/authors");
  return { success: "El Autor ha sido bloqueado." };
}

export async function reactivateAuthorAction(prevState: unknown, formData: FormData) {
  const targetUserId = formData.get("targetUserId");

  if (typeof targetUserId !== "string" || !targetUserId) {
    return { error: "ID de usuario inválido." };
  }

  const admin = await requireAdmin();
  const metadata = await getMetadata();

  const result = await reactivateAuthor(targetUserId, admin.id, metadata);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/authors");
  return { success: "El Autor ha sido reactivado." };
}

export async function resetAuthorPasswordAction(prevState: unknown, formData: FormData) {
  const targetUserId = formData.get("targetUserId");

  if (typeof targetUserId !== "string" || !targetUserId) {
    return { error: "ID de usuario inválido." };
  }

  const admin = await requireAdmin();
  const metadata = await getMetadata();

  const result = await resetAuthorTemporaryPassword(targetUserId, admin.id, metadata);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/authors");
  return { temporaryPassword: result.temporaryPassword };
}
