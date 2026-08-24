import { index, inet, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { auditActionTypes } from "./audit-action-types";
import { sql } from "drizzle-orm";

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    actionTypeId: smallint("action_type_id")
      .notNull()
      .references(() => auditActionTypes.id, { onDelete: "restrict" }),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .default(sql`NOW()`),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("audit_events_actor_user_id_idx").on(table.actorUserId),
    index("audit_events_action_type_id_idx").on(table.actionTypeId),
    index("audit_events_occurred_at_idx").on(table.occurredAt),
  ]
);
