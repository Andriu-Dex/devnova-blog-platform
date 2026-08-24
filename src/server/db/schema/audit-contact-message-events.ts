import { index, pgTable, uuid } from "drizzle-orm/pg-core";
import { auditEvents } from "./audit-events";
import { contactMessages } from "./contact-messages";
import { contactMessageStatusHistory } from "./contact-message-status-history";

export const auditContactMessageEvents = pgTable(
  "audit_contact_message_events",
  {
    auditEventId: uuid("audit_event_id")
      .primaryKey()
      .references(() => auditEvents.id, { onDelete: "restrict" }),
    contactMessageId: uuid("contact_message_id")
      .notNull()
      .references(() => contactMessages.id, { onDelete: "restrict" }),
    previousStatusHistoryId: uuid("previous_status_history_id").references(
      () => contactMessageStatusHistory.id,
      { onDelete: "restrict" }
    ),
    newStatusHistoryId: uuid("new_status_history_id").references(
      () => contactMessageStatusHistory.id,
      { onDelete: "restrict" }
    ),
  },
  (table) => [
    index("audit_contact_message_events_contact_message_id_idx").on(
      table.contactMessageId
    ),
  ]
);
