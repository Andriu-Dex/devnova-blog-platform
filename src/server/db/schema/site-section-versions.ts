import { pgTable, uuid, varchar, integer, text, timestamp, unique, check, index, AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { siteSections } from "./site-sections";
import { users } from "./users";

export const siteSectionVersions = pgTable(
  "site_section_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteSectionId: uuid("site_section_id")
      .notNull()
      .references(() => siteSections.id, { onDelete: "restrict" }),
    versionNumber: integer("version_number").notNull(),
    title: varchar("title", { length: 200 }),
    contentMarkdown: text("content_markdown").notNull(),
    editedByUserId: uuid("edited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    changeSummary: varchar("change_summary", { length: 500 }),
    restoredFromVersionId: uuid("restored_from_version_id").references(
      (): AnyPgColumn => siteSectionVersions.id,
      { onDelete: "restrict" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("site_section_versions_site_section_id_version_number_unique").on(
      table.siteSectionId,
      table.versionNumber
    ),
    check("site_section_versions_version_number_check", sql`${table.versionNumber} > 0`),
    index("site_section_versions_edited_by_user_id_idx").on(table.editedByUserId),
    index("site_section_versions_created_at_idx").on(table.createdAt),
  ]
);
