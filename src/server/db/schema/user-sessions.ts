import { pgTable, uuid, text, timestamp, index, check, customType } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

const inet = customType<{ data: string }>({
  dataType() {
    return 'inet';
  },
});

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("user_sessions_user_id_idx").on(table.userId),
    index("user_sessions_expires_at_idx").on(table.expiresAt),
    check("user_sessions_expires_check", sql`${table.expiresAt} > ${table.createdAt}`)
  ]
);
