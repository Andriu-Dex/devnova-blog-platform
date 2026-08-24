import { index, pgTable, uuid } from "drizzle-orm/pg-core";
import { auditEvents } from "./audit-events";
import { mediaAssets } from "./media-assets";

export const auditMediaEvents = pgTable(
  "audit_media_events",
  {
    auditEventId: uuid("audit_event_id")
      .primaryKey()
      .references(() => auditEvents.id, { onDelete: "restrict" }),
    mediaAssetId: uuid("media_asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "restrict" }),
  },
  (table) => [
    index("audit_media_events_media_asset_id_idx").on(table.mediaAssetId),
  ]
);
