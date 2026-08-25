import { pgTable, uuid, varchar, integer, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const blogCategories = pgTable(
  "blog_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    colorClass: varchar("color_class", { length: 40 }),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("blog_categories_slug_lower_idx").on(sql`lower(${table.slug})`),
    index("blog_categories_display_order_idx").on(table.displayOrder),
    index("blog_categories_deleted_at_idx").on(table.deletedAt),
  ]
);
