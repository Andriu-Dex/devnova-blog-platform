import { pgTable, uuid } from "drizzle-orm/pg-core";
import { auditEvents } from "./audit-events";
import { siteProfileVersions } from "./site-profile-versions";

export const auditSiteProfileEvents = pgTable("audit_site_profile_events", {
  auditEventId: uuid("audit_event_id")
    .primaryKey()
    .references(() => auditEvents.id, { onDelete: "restrict" }),
  previousVersionId: uuid("previous_version_id").references(
    () => siteProfileVersions.id,
    { onDelete: "restrict" }
  ),
  newVersionId: uuid("new_version_id").references(
    () => siteProfileVersions.id,
    { onDelete: "restrict" }
  ),
});
