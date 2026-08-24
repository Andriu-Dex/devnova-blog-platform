import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { auditEvents } from "./audit-events";

export const auditAuthEvents = pgTable("audit_auth_events", {
  auditEventId: uuid("audit_event_id")
    .primaryKey()
    .references(() => auditEvents.id, { onDelete: "restrict" }),
  attemptedUsername: varchar("attempted_username", { length: 80 }).notNull(),
});
