import { pgTable, uuid, varchar, integer, text, timestamp, unique, check, index, AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { blogs } from "./blogs";
import { users } from "./users";
import { mediaAssets } from "./media-assets";

export const blogVersions = pgTable(
  "blog_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blogId: uuid("blog_id")
      .notNull()
      .references(() => blogs.id, { onDelete: "restrict" }),
    versionNumber: integer("version_number").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    summary: varchar("summary", { length: 500 }).notNull(),
    contentMarkdown: text("content_markdown").notNull(),
    coverMediaAssetId: uuid("cover_media_asset_id").references(() => mediaAssets.id, { onDelete: "restrict" }),
    coverAltText: varchar("cover_alt_text", { length: 255 }),
    editedByUserId: uuid("edited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    changeSummary: varchar("change_summary", { length: 500 }),
    restoredFromVersionId: uuid("restored_from_version_id").references(
      (): AnyPgColumn => blogVersions.id,
      { onDelete: "restrict" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("blog_versions_blog_id_version_number_unique").on(table.blogId, table.versionNumber),
    unique("blog_versions_blog_id_id_unique").on(table.blogId, table.id),
    check("blog_versions_version_number_check", sql`${table.versionNumber} > 0`),
    index("blog_versions_edited_by_user_id_idx").on(table.editedByUserId),
    index("blog_versions_created_at_idx").on(table.createdAt),
  ]
);
