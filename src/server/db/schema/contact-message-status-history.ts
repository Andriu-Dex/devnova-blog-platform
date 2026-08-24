import { pgTable, uuid, smallint, integer, timestamp, unique, check, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { contactMessages } from "./contact-messages";
import { contactMessageStatuses } from "./contact-message-statuses";
import { users } from "./users";

export const contactMessageStatusHistory = pgTable(
  "contact_message_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactMessageId: uuid("contact_message_id")
      .notNull()
      .references(() => contactMessages.id, { onDelete: "restrict" }),
    sequenceNumber: integer("sequence_number").notNull(),
    statusId: smallint("status_id")
      .notNull()
      .references(() => contactMessageStatuses.id, { onDelete: "restrict" }),
    changedByUserId: uuid("changed_by_user_id").references(() => users.id, { onDelete: "restrict" }),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("contact_message_status_history_message_seq_unique").on(
      table.contactMessageId,
      table.sequenceNumber
    ),
    check("contact_message_status_history_sequence_number_check", sql`${table.sequenceNumber} > 0`),
    index("contact_message_status_history_status_id_idx").on(table.statusId),
    index("contact_message_status_history_changed_at_idx").on(table.changedAt),
  ]
);
