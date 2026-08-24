import { index, pgTable, uuid } from "drizzle-orm/pg-core";
import { auditEvents } from "./audit-events";
import { siteSocialLinks } from "./site-social-links";

export const auditSiteSocialLinkEvents = pgTable(
  "audit_site_social_link_events",
  {
    auditEventId: uuid("audit_event_id")
      .primaryKey()
      .references(() => auditEvents.id, { onDelete: "restrict" }),
    siteSocialLinkId: uuid("site_social_link_id")
      .notNull()
      .references(() => siteSocialLinks.id, { onDelete: "restrict" }),
  },
  (table) => [
    index("audit_site_social_link_events_site_social_link_id_idx").on(
      table.siteSocialLinkId
    ),
  ]
);
