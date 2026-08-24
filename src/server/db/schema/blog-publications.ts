import { pgTable, uuid, timestamp, foreignKey } from "drizzle-orm/pg-core";
import { blogs } from "./blogs";
import { blogVersions } from "./blog-versions";
import { users } from "./users";

export const blogPublications = pgTable(
  "blog_publications",
  {
    blogId: uuid("blog_id")
      .primaryKey()
      .references(() => blogs.id, { onDelete: "restrict" }),
    blogVersionId: uuid("blog_version_id").notNull(),
    publishedByUserId: uuid("published_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.blogId, table.blogVersionId],
      foreignColumns: [blogVersions.blogId, blogVersions.id],
      name: "blog_publications_blog_id_blog_version_id_fk",
    }).onDelete("restrict"),
  ]
);
