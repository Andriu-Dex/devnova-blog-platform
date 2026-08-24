import { index, pgTable, smallint, uuid } from "drizzle-orm/pg-core";
import { auditEvents } from "./audit-events";
import { users } from "./users";
import { userStatuses } from "./user-statuses";

export const auditUserEvents = pgTable(
  "audit_user_events",
  {
    auditEventId: uuid("audit_event_id")
      .primaryKey()
      .references(() => auditEvents.id, { onDelete: "restrict" }),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    previousStatusId: smallint("previous_status_id").references(
      () => userStatuses.id,
      { onDelete: "restrict" }
    ),
    newStatusId: smallint("new_status_id").references(() => userStatuses.id, {
      onDelete: "restrict",
    }),
  },
  (table) => [
    index("audit_user_events_target_user_id_idx").on(table.targetUserId),
  ]
);
