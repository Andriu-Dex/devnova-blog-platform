"use server";

import { requireAdmin } from "@/server/auth/authorization";
import { revalidatePath } from "next/cache";
import {
  createTeamMember,
  updateTeamMember,
  restoreTeamMemberVersion,
  softDeleteTeamMember,
  recoverTeamMember
} from "@/server/team/team-service";

export type FormState = { error: string; success: boolean };

function validateGithubUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== "https:") return false;
    if (url.hostname !== "github.com" && !url.hostname.endsWith(".github.com")) return false;
    return true;
  } catch {
    return false;
  }
}

function validateLinkedinUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    if (url.protocol !== "https:") return false;
    if (url.hostname !== "linkedin.com" && !url.hostname.endsWith(".linkedin.com")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function createTeamMemberAction(state: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await requireAdmin();
    const fullName = (formData.get("fullName") as string)?.trim() || "";
    const roleTitle = (formData.get("roleTitle") as string)?.trim() || "";
    const bioMarkdown = (formData.get("bioMarkdown") as string) || "";
    const photoMediaAssetId = (formData.get("photoMediaAssetId") as string) || null;
    const photoAltText = (formData.get("photoAltText") as string)?.trim() || null;
    const githubUrl = (formData.get("githubUrl") as string)?.trim() || null;
    const linkedinUrl = (formData.get("linkedinUrl") as string)?.trim() || null;
    const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;
    const isVisible = formData.get("isVisible") === "true";

    if (!fullName || fullName.length > 180) return { error: "El nombre es obligatorio y debe tener como máximo 180 caracteres.", success: false };
    if (!roleTitle || roleTitle.length > 160) return { error: "El cargo es obligatorio y debe tener como máximo 160 caracteres.", success: false };
    if (!bioMarkdown.trim()) return { error: "La biografía no puede estar vacía.", success: false };
    
    if (photoMediaAssetId && (!photoAltText || photoAltText.length === 0)) {
      return { error: "El texto alternativo es obligatorio si se incluye una foto.", success: false };
    }

    if (githubUrl && !validateGithubUrl(githubUrl)) return { error: "La URL de GitHub no es válida.", success: false };
    if (linkedinUrl && !validateLinkedinUrl(linkedinUrl)) return { error: "La URL de LinkedIn no es válida.", success: false };

    await createTeamMember(admin.id, {
      fullName,
      roleTitle,
      bioMarkdown,
      photoMediaAssetId,
      photoAltText,
      githubUrl,
      linkedinUrl,
      displayOrder,
      isVisible
    });

    revalidatePath("/admin/team");
    revalidatePath("/nosotros");
    return { error: "", success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message, success: false };
    }
    return { error: "Ocurrió un error inesperado.", success: false };
  }
}

export async function updateTeamMemberAction(state: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await requireAdmin();
    const memberId = formData.get("memberId") as string;
    const baseVersionId = formData.get("baseVersionId") as string;
    const changeSummary = (formData.get("changeSummary") as string)?.trim() || "";
    const fullName = (formData.get("fullName") as string)?.trim() || "";
    const roleTitle = (formData.get("roleTitle") as string)?.trim() || "";
    const bioMarkdown = (formData.get("bioMarkdown") as string) || "";
    const photoMediaAssetId = (formData.get("photoMediaAssetId") as string) || null;
    const photoAltText = (formData.get("photoAltText") as string)?.trim() || null;
    const githubUrl = (formData.get("githubUrl") as string)?.trim() || null;
    const linkedinUrl = (formData.get("linkedinUrl") as string)?.trim() || null;
    const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;
    const isVisible = formData.get("isVisible") === "true";

    if (!memberId || !baseVersionId) return { error: "Faltan identificadores del integrante.", success: false };
    if (!changeSummary || changeSummary.length > 500) return { error: "El motivo de actualización es obligatorio y debe tener como máximo 500 caracteres.", success: false };
    if (!fullName || fullName.length > 180) return { error: "El nombre es obligatorio y debe tener como máximo 180 caracteres.", success: false };
    if (!roleTitle || roleTitle.length > 160) return { error: "El cargo es obligatorio y debe tener como máximo 160 caracteres.", success: false };
    if (!bioMarkdown.trim()) return { error: "La biografía no puede estar vacía.", success: false };
    
    if (photoMediaAssetId && (!photoAltText || photoAltText.length === 0)) {
      return { error: "El texto alternativo es obligatorio si se incluye una foto.", success: false };
    }

    if (githubUrl && !validateGithubUrl(githubUrl)) return { error: "La URL de GitHub no es válida.", success: false };
    if (linkedinUrl && !validateLinkedinUrl(linkedinUrl)) return { error: "La URL de LinkedIn no es válida.", success: false };

    await updateTeamMember(admin.id, memberId, {
      baseVersionId,
      fullName,
      roleTitle,
      bioMarkdown,
      photoMediaAssetId,
      photoAltText,
      githubUrl,
      linkedinUrl,
      displayOrder,
      isVisible,
      changeSummary
    });

    revalidatePath(`/admin/team/${memberId}/edit`);
    revalidatePath(`/admin/team/${memberId}/history`);
    revalidatePath("/admin/team");
    revalidatePath("/nosotros");
    return { error: "", success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message, success: false };
    }
    return { error: "Ocurrió un error inesperado.", success: false };
  }
}

export async function restoreTeamMemberFormAction(state: FormState, formData: FormData): Promise<FormState> {
  try {
    const admin = await requireAdmin();
    const memberId = formData.get("memberId") as string;
    const sourceVersionId = formData.get("sourceVersionId") as string;
    const changeSummary = (formData.get("changeSummary") as string)?.trim() || "";

    if (!memberId) return { error: "Falta ID de integrante.", success: false };
    if (!sourceVersionId) return { error: "Falta ID de versión fuente.", success: false };
    if (!changeSummary || changeSummary.length > 500) return { error: "Falta motivo de restauración (máx 500 caracteres).", success: false };

    await restoreTeamMemberVersion(admin.id, memberId, sourceVersionId, changeSummary);

    revalidatePath(`/admin/team/${memberId}/history`);
    revalidatePath(`/admin/team/${memberId}/edit`);
    revalidatePath("/admin/team");
    revalidatePath("/nosotros");
    return { error: "", success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message, success: false };
    }
    return { error: "Ocurrió un error inesperado.", success: false };
  }
}

export async function deleteTeamMemberAction(memberId: string) {
  const admin = await requireAdmin();
  await softDeleteTeamMember(admin.id, memberId);
  revalidatePath("/admin/team");
  revalidatePath("/admin/team/trash");
  revalidatePath("/nosotros");
}

export async function recoverTeamMemberAction(memberId: string) {
  const admin = await requireAdmin();
  await recoverTeamMember(admin.id, memberId);
  revalidatePath("/admin/team");
  revalidatePath("/admin/team/trash");
  revalidatePath("/nosotros");
}
