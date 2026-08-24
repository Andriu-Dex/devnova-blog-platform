import { pgTable, smallint, varchar } from "drizzle-orm/pg-core";

export const socialPlatforms = pgTable("social_platforms", {
  id: smallint("id").primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 60 }).notNull(),
});
