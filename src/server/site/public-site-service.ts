import { db } from "@/server/db";
import {
  siteProfileVersions,
  siteSections,
  siteSectionVersions,
  mediaAssets,
  teamMembers,
  teamMemberVersions,
  siteSocialLinks,
  socialPlatforms
} from "@/server/db/schema";
import { eq, desc, asc, isNull, and, sql } from "drizzle-orm";
import { isValidSocialUrl } from "@/server/social/social-url";

export async function getPublicSiteProfile() {
  const rows = await db
    .select({
      groupName: siteProfileVersions.groupName,
      tagline: siteProfileVersions.tagline,
      logoMediaAssetId: siteProfileVersions.logoMediaAssetId,
      logoAltText: siteProfileVersions.logoAltText,
      publicEmail: siteProfileVersions.publicEmail,
      publicPhone: siteProfileVersions.publicPhone,
      logoPublicId: mediaAssets.cloudinaryPublicId,
    })
    .from(siteProfileVersions)
    .leftJoin(mediaAssets, eq(siteProfileVersions.logoMediaAssetId, mediaAssets.id))
    .orderBy(desc(siteProfileVersions.versionNumber))
    .limit(1);

  return rows[0] || null;
}

export async function getPublicSection(sectionKey: string) {
  const sec = await db
    .select({ id: siteSections.id })
    .from(siteSections)
    .where(eq(siteSections.sectionKey, sectionKey));
  
  if (!sec[0]) return null;

  const rows = await db
    .select({
      title: siteSectionVersions.title,
      contentMarkdown: siteSectionVersions.contentMarkdown,
    })
    .from(siteSectionVersions)
    .where(eq(siteSectionVersions.siteSectionId, sec[0].id))
    .orderBy(desc(siteSectionVersions.versionNumber))
    .limit(1);

  return rows[0] || null;
}

export async function getPublicTeamMembers() {
  const latestSubquery = db
    .select({
      teamMemberId: teamMemberVersions.teamMemberId,
      maxVersion: sql<number>`MAX(${teamMemberVersions.versionNumber})`.as("max_version")
    })
    .from(teamMemberVersions)
    .groupBy(teamMemberVersions.teamMemberId)
    .as("latest_versions");

  const rows = await db
    .select({
      id: teamMembers.id,
      fullName: teamMemberVersions.fullName,
      roleTitle: teamMemberVersions.roleTitle,
      bioMarkdown: teamMemberVersions.bioMarkdown,
      githubUrl: teamMemberVersions.githubUrl,
      linkedinUrl: teamMemberVersions.linkedinUrl,
      photoPublicId: mediaAssets.cloudinaryPublicId,
      photoAltText: teamMemberVersions.photoAltText,
      displayOrder: teamMemberVersions.displayOrder,
      createdAt: teamMembers.createdAt,
    })
    .from(teamMembers)
    .innerJoin(latestSubquery, eq(teamMembers.id, latestSubquery.teamMemberId))
    .innerJoin(
      teamMemberVersions,
      and(
        eq(teamMemberVersions.teamMemberId, latestSubquery.teamMemberId),
        eq(teamMemberVersions.versionNumber, latestSubquery.maxVersion)
      )
    )
    .leftJoin(mediaAssets, eq(teamMemberVersions.photoMediaAssetId, mediaAssets.id))
    .where(
      and(
        isNull(teamMembers.deletedAt),
        eq(teamMemberVersions.isVisible, true)
      )
    )
    .orderBy(asc(teamMemberVersions.displayOrder), asc(teamMembers.createdAt));

  return rows;
}

export async function getPublicSocialLinks() {
  const rows = await db
    .select({
      platformCode: socialPlatforms.code,
      platformName: socialPlatforms.name,
      url: siteSocialLinks.url,
      displayOrder: siteSocialLinks.displayOrder,
    })
    .from(siteSocialLinks)
    .innerJoin(socialPlatforms, eq(siteSocialLinks.socialPlatformId, socialPlatforms.id))
    .where(eq(siteSocialLinks.isVisible, true))
    .orderBy(asc(siteSocialLinks.displayOrder), asc(socialPlatforms.code));
    
  return rows.filter(row => isValidSocialUrl(row.platformCode, row.url));
}
