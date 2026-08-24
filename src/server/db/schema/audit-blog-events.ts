import { foreignKey, index, pgTable, uuid } from "drizzle-orm/pg-core";
import { auditEvents } from "./audit-events";
import { blogs } from "./blogs";
import { blogVersions } from "./blog-versions";

export const auditBlogEvents = pgTable(
  "audit_blog_events",
  {
    auditEventId: uuid("audit_event_id")
      .primaryKey()
      .references(() => auditEvents.id, { onDelete: "restrict" }),
    blogId: uuid("blog_id")
      .notNull()
      .references(() => blogs.id, { onDelete: "restrict" }),
    previousVersionId: uuid("previous_version_id"),
    newVersionId: uuid("new_version_id"),
  },
  (table) => [
    foreignKey({
      columns: [table.blogId, table.previousVersionId],
      foreignColumns: [blogVersions.blogId, blogVersions.id],
      name: "audit_blog_events_prev_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.blogId, table.newVersionId],
      foreignColumns: [blogVersions.blogId, blogVersions.id],
      name: "audit_blog_events_new_fk",
    }).onDelete("restrict"),
    index("audit_blog_events_blog_id_idx").on(table.blogId),
  ]
);
