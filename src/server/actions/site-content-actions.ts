"use server";

import { requireAdmin } from "@/server/auth/authorization";
import { updateSiteProfile, restoreProfileVersion, updateSiteSection, restoreSectionVersion } from "@/server/site/site-content-service";
import { revalidatePath } from "next/cache";

export type FormState = { error: string; success: boolean };

export async function updateProfileFormAction(state: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  
  const groupName = formData.get("groupName") as string;
  const tagline = formData.get("tagline") as string;
  const logoMediaAssetId = formData.get("logoMediaAssetId") as string;
  const logoAltText = formData.get("logoAltText") as string;
  const publicEmail = formData.get("publicEmail") as string;
  const publicPhone = formData.get("publicPhone") as string;
  const changeSummary = formData.get("changeSummary") as string;
  const baseVersionId = formData.get("baseVersionId") as string;

  if (!groupName || groupName.trim() === "") {
    return { error: "El nombre del grupo es obligatorio.", success: false };
  }
  
  if (logoMediaAssetId && (!logoAltText || logoAltText.trim() === "")) {
    return { error: "El texto alternativo es obligatorio si se selecciona un logo.", success: false };
  }

  try {
    await updateSiteProfile(admin.id, {
      groupName,
      tagline,
      logoMediaAssetId: logoMediaAssetId || null,
      logoAltText,
      publicEmail,
      publicPhone,
      changeSummary: changeSummary || "Actualización de perfil",
      baseVersionId: baseVersionId || null,
    });

    revalidatePath("/");
    revalidatePath("/admin/content/profile");
    return { error: "", success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno al actualizar el perfil.";
    return { error: msg, success: false };
  }
}

export async function restoreProfileFormAction(state: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const sourceVersionId = formData.get("sourceVersionId") as string;
  const changeSummary = formData.get("changeSummary") as string;

  if (!sourceVersionId) return { error: "Falta ID de versión fuente.", success: false };
  if (!changeSummary) return { error: "Falta motivo de restauración.", success: false };

  try {
    await restoreProfileVersion(admin.id, sourceVersionId, changeSummary);
    revalidatePath("/");
    revalidatePath("/admin/content/profile");
    return { error: "", success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al restaurar el perfil.";
    return { error: msg, success: false };
  }
}

export async function updateSectionFormAction(state: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  
  const sectionKey = formData.get("sectionKey") as string;
  const title = formData.get("title") as string;
  const contentMarkdown = formData.get("contentMarkdown") as string;
  const changeSummary = formData.get("changeSummary") as string;
  const baseVersionId = formData.get("baseVersionId") as string;

  if (!sectionKey) return { error: "Falta sectionKey.", success: false };
  if (!contentMarkdown || contentMarkdown.trim() === "") {
    return { error: "El contenido no puede estar vacío.", success: false };
  }

  try {
    await updateSiteSection(admin.id, sectionKey, {
      title,
      contentMarkdown,
      changeSummary: changeSummary || "Edición de sección",
      baseVersionId: baseVersionId || null,
    });

    revalidatePath("/");
    revalidatePath("/nosotros");
    revalidatePath("/contacto");
    revalidatePath(`/admin/content/sections/${sectionKey}`);
    return { error: "", success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno al actualizar la sección.";
    return { error: msg, success: false };
  }
}

export async function restoreSectionFormAction(state: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const sectionKey = formData.get("sectionKey") as string;
  const sourceVersionId = formData.get("sourceVersionId") as string;
  const changeSummary = formData.get("changeSummary") as string;

  if (!sectionKey) return { error: "Key de sección es obligatorio.", success: false };
  if (!sourceVersionId) return { error: "Falta ID de versión fuente.", success: false };
  if (!changeSummary) return { error: "Motivo de actualización es obligatorio.", success: false };

  try {
    await restoreSectionVersion(admin.id, sectionKey, sourceVersionId, changeSummary);
    revalidatePath("/");
    revalidatePath("/nosotros");
    revalidatePath("/contacto");
    revalidatePath(`/admin/content/sections/${sectionKey}`);
    return { error: "", success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al restaurar la sección.";
    return { error: msg, success: false };
  }
}
