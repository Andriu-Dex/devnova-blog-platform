import { pgTable, smallint, varchar } from "drizzle-orm/pg-core";

export const contactMessageStatuses = pgTable("contact_message_statuses", {
  id: smallint("id").primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
});
