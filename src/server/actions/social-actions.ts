"use server";

import { requireAdmin } from "@/server/auth/authorization";
import { revalidatePath } from "next/cache";
import { upsertSocialLink } from "@/server/social/social-service";

export type FormState = { error: string; success: boolean };

export async function upsertSocialLinkAction(state: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await requireAdmin();
    const platformCode = formData.get("platformCode") as string;
    const url = (formData.get("url") as string)?.trim() || "";
    const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;
    const isVisible = formData.get("isVisible") === "true";

    if (!platformCode) return { error: "Falta el código de la plataforma.", success: false };
    
    if (url) {
      if (!url.startsWith("https://")) {
        return { error: "La URL debe ser segura (https://) o dejarse en blanco para deshabilitar.", success: false };
      }
      if (url.length > 500) {
        return { error: "La URL es demasiado larga.", success: false };
      }
    }

    await upsertSocialLink(admin.id, platformCode, {
      url,
      displayOrder,
      isVisible
    });

    revalidatePath("/admin/social");
    revalidatePath("/");
    revalidatePath("/nosotros"); // Revalidate all pages that might use the footer
    
    return { error: "", success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message, success: false };
    }
    return { error: "Ocurrió un error inesperado.", success: false };
  }
}
