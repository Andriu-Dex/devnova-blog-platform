import { pgTable, uuid, varchar, integer, text, boolean, timestamp, unique, check, index, AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { teamMembers } from "./team-members";
import { mediaAssets } from "./media-assets";
import { users } from "./users";

export const teamMemberVersions = pgTable(
  "team_member_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamMemberId: uuid("team_member_id")
      .notNull()
      .references(() => teamMembers.id, { onDelete: "restrict" }),
    versionNumber: integer("version_number").notNull(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    roleTitle: varchar("role_title", { length: 120 }),
    bioMarkdown: text("bio_markdown"),
    photoMediaAssetId: uuid("photo_media_asset_id").references(() => mediaAssets.id, { onDelete: "restrict" }),
    photoAltText: varchar("photo_alt_text", { length: 255 }),
    githubUrl: varchar("github_url", { length: 500 }),
    linkedinUrl: varchar("linkedin_url", { length: 500 }),
    displayOrder: integer("display_order").notNull(),
    isVisible: boolean("is_visible").notNull().default(true),
    editedByUserId: uuid("edited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    changeSummary: varchar("change_summary", { length: 500 }),
    restoredFromVersionId: uuid("restored_from_version_id").references(
      (): AnyPgColumn => teamMemberVersions.id,
      { onDelete: "restrict" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("team_member_versions_team_member_id_version_number_unique").on(
      table.teamMemberId,
      table.versionNumber
    ),
    check("team_member_versions_version_number_check", sql`${table.versionNumber} > 0`),
    check("team_member_versions_display_order_check", sql`${table.displayOrder} >= 0`),
    index("team_member_versions_edited_by_user_id_idx").on(table.editedByUserId),
    index("team_member_versions_created_at_idx").on(table.createdAt),
  ]
);
