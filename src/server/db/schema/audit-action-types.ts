import { pgTable, smallint, varchar } from "drizzle-orm/pg-core";

export const auditActionTypes = pgTable("audit_action_types", {
  id: smallint("id").primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
});
