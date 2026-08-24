import { pgTable, smallint, varchar } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
  id: smallint("id").primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
});
