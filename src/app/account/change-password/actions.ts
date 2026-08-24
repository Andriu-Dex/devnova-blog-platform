"use server";

import { requireAuthenticatedUser } from "@/server/auth/authorization";
import { completeRequiredPasswordChange } from "@/server/users/password-service";
import { validatePasswordForHashing } from "@/server/security/password";
import { deleteSessionCookie } from "@/server/auth/auth-cookie";
import { headers } from "next/headers";
import net from "node:net";
import { redirect } from "next/navigation";

export async function completeRequiredPasswordChangeAction(prevState: unknown, formData: FormData) {
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof currentPassword !== "string" || !currentPassword) {
    return { error: "La contraseña actual es requerida." };
  }
  if (typeof newPassword !== "string" || !newPassword) {
    return { error: "La nueva contraseña es requerida." };
  }
  if (typeof confirmPassword !== "string" || !confirmPassword) {
    return { error: "Debe confirmar la nueva contraseña." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "La confirmación no coincide con la nueva contraseña." };
  }

  try {
    validatePasswordForHashing(newPassword);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "La contraseña no cumple con los requisitos." };
  }

  const user = await requireAuthenticatedUser();

  if (!user.mustChangePassword) {
    // If not required to change password, they shouldn't be using this action.
    return { error: "No es necesario cambiar la contraseña." };
  }

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

  const result = await completeRequiredPasswordChange(user.id, currentPassword, newPassword, { ipAddress, userAgent });

  if (result.error) {
    return { error: result.error };
  }

  // If successful, all sessions (including current) have been revoked inside the transaction.
  await deleteSessionCookie();

  // Redirect to login explicitly catching the Next.js navigation error is handled by Next.js automatically
  redirect("/login?passwordChanged=1");
}
