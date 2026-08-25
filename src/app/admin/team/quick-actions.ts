"use server";

import { requireAdmin } from "@/server/auth/authorization";
import { db } from "@/server/db";
import { teamMemberVersions } from "@/server/db/schema";
import { updateTeamMember } from "@/server/team/team-service";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateOrderAction(memberId: string, newOrder: number) {
  try {
    const admin = await requireAdmin();

    const latestVersions = await db
      .select()
      .from(teamMemberVersions)
      .where(eq(teamMemberVersions.teamMemberId, memberId))
      .orderBy(desc(teamMemberVersions.versionNumber))
      .limit(1);

    if (latestVersions.length === 0) throw new Error("No version found");

    const latest = latestVersions[0];

    if (latest.displayOrder === newOrder) return; // No change

    await updateTeamMember(admin.id, memberId, {
      baseVersionId: latest.id,
      fullName: latest.fullName,
      roleTitle: latest.roleTitle || "",
      bioMarkdown: latest.bioMarkdown || "",
      photoMediaAssetId: latest.photoMediaAssetId,
      photoAltText: latest.photoAltText,
      githubUrl: latest.githubUrl,
      linkedinUrl: latest.linkedinUrl,
      displayOrder: newOrder,
      isVisible: latest.isVisible,
      changeSummary: `Reordenado a ${newOrder}`,
    });

    revalidatePath("/admin/team");
    revalidatePath("/nosotros");
  } catch (error) {
    console.error("updateOrderAction failed:", error instanceof Error ? error.message : "Unknown error");
  }
}
