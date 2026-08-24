import { pgTable, uuid, smallint, varchar, integer, boolean, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { socialPlatforms } from "./social-platforms";

export const siteSocialLinks = pgTable(
  "site_social_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    socialPlatformId: smallint("social_platform_id")
      .notNull()
      .unique()
      .references(() => socialPlatforms.id, { onDelete: "restrict" }),
    url: varchar("url", { length: 500 }).notNull(),
    displayOrder: integer("display_order").notNull(),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("site_social_links_display_order_check", sql`${table.displayOrder} >= 0`),
  ]
);
