import { pgTable, uuid, varchar, smallint, timestamp, uniqueIndex, AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { roles } from "./roles";
import { userStatuses } from "./user-statuses";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 80 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    roleId: smallint("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    statusId: smallint("status_id")
      .notNull()
      .references(() => userStatuses.id, { onDelete: "restrict" }),
    createdByUserId: uuid("created_by_user_id").references(
      (): AnyPgColumn => users.id,
      { onDelete: "restrict" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_username_lower_idx").on(sql`lower(${table.username})`),
  ]
);
