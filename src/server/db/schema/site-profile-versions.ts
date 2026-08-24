import { pgTable, uuid, varchar, integer, timestamp, check, index, AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { mediaAssets } from "./media-assets";
import { users } from "./users";

export const siteProfileVersions = pgTable(
  "site_profile_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    versionNumber: integer("version_number").notNull().unique(),
    groupName: varchar("group_name", { length: 150 }).notNull(),
    tagline: varchar("tagline", { length: 250 }),
    logoMediaAssetId: uuid("logo_media_asset_id").references(() => mediaAssets.id, { onDelete: "restrict" }),
    logoAltText: varchar("logo_alt_text", { length: 255 }),
    publicEmail: varchar("public_email", { length: 255 }),
    publicPhone: varchar("public_phone", { length: 30 }),
    editedByUserId: uuid("edited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    changeSummary: varchar("change_summary", { length: 500 }),
    restoredFromVersionId: uuid("restored_from_version_id").references(
      (): AnyPgColumn => siteProfileVersions.id,
      { onDelete: "restrict" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("site_profile_versions_version_number_check", sql`${table.versionNumber} > 0`),
    index("site_profile_versions_edited_by_user_id_idx").on(table.editedByUserId),
    index("site_profile_versions_created_at_idx").on(table.createdAt),
  ]
);
