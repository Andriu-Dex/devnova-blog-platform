import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderName: varchar("sender_name", { length: 150 }).notNull(),
    senderEmail: varchar("sender_email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    messageBody: text("message_body").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("contact_messages_received_at_idx").on(table.receivedAt),
  ]
);
