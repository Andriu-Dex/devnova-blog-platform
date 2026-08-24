"use server";

import { authenticateWithPassword, revokeCurrentSession } from "@/server/auth/authentication-service";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export interface LoginState {
  error?: string;
}

export async function loginAction(prevState: LoginState, formData: FormData): Promise<LoginState> {
  try {
    const rawUsername = formData.get("username");
    const rawPassword = formData.get("password");

    if (typeof rawUsername !== "string" || typeof rawPassword !== "string") {
      return { error: "Datos de formulario inválidos." };
    }

    const username = rawUsername.trim();
    if (!username || username.length > 80) {
      return { error: "Usuario o contraseña incorrectos." };
    }

    const password = rawPassword; // No trim
    if (!password || password.length > 128) {
      return { error: "Usuario o contraseña incorrectos." };
    }

    const reqHeaders = await headers();
    const userAgent = reqHeaders.get("user-agent") || null;
    const ipAddress = reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() || reqHeaders.get("x-real-ip") || null;

    const result = await authenticateWithPassword(username, password, {
      ipAddress,
      userAgent,
    });

    if (!result.ok) {
      if (result.code === "INVALID_CREDENTIALS" || result.code === "USER_BLOCKED") {
        return { error: "Usuario o contraseña incorrectos." };
      }
      return { error: "No fue posible iniciar sesión en este momento. Inténtalo nuevamente." };
    }

  } catch (error) {
    // Si es un error de redirección interno de Next.js, debemos propagarlo
    if (error && typeof error === "object" && "digest" in error && (error as Record<string, unknown>).digest?.toString().startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Internal login error:", error);
    return { error: "No fue posible iniciar sesión en este momento. Inténtalo nuevamente." };
  }

  // Redirigir fuera del bloque try-catch para no interceptar el NEXT_REDIRECT
  redirect("/login");
}

export async function logoutAction(): Promise<void> {
  await revokeCurrentSession();
  redirect("/login");
}
