import { pgTable, uuid, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const siteSections = pgTable(
  "site_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionKey: varchar("section_key", { length: 50 }).notNull(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("site_sections_section_key_lower_idx").on(sql`lower(${table.sectionKey})`),
  ]
);
