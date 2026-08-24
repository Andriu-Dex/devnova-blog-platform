import { index, pgTable, uuid } from "drizzle-orm/pg-core";
import { auditEvents } from "./audit-events";
import { siteSections } from "./site-sections";
import { siteSectionVersions } from "./site-section-versions";

export const auditSiteSectionEvents = pgTable(
  "audit_site_section_events",
  {
    auditEventId: uuid("audit_event_id")
      .primaryKey()
      .references(() => auditEvents.id, { onDelete: "restrict" }),
    siteSectionId: uuid("site_section_id")
      .notNull()
      .references(() => siteSections.id, { onDelete: "restrict" }),
    previousVersionId: uuid("previous_version_id").references(
      () => siteSectionVersions.id,
      { onDelete: "restrict" }
    ),
    newVersionId: uuid("new_version_id").references(
      () => siteSectionVersions.id,
      { onDelete: "restrict" }
    ),
  },
  (table) => [
    index("audit_site_section_events_site_section_id_idx").on(
      table.siteSectionId
    ),
  ]
);
