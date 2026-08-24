import { pgTable, uuid, varchar, integer, bigint, timestamp, check, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cloudinaryAssetId: varchar("cloudinary_asset_id", { length: 255 }).notNull().unique(),
    cloudinaryPublicId: varchar("cloudinary_public_id", { length: 255 }).notNull().unique(),
    resourceType: varchar("resource_type", { length: 30 }).notNull(),
    format: varchar("format", { length: 20 }).notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    uploadedByUserId: uuid("uploaded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    check("media_assets_width_check", sql`${table.width} > 0`),
    check("media_assets_height_check", sql`${table.height} > 0`),
    check("media_assets_size_bytes_check", sql`${table.sizeBytes} > 0`),
    index("media_assets_uploaded_by_user_id_idx").on(table.uploadedByUserId),
  ]
);
