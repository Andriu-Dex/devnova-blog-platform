import { pgTable, uuid, primaryKey, index } from "drizzle-orm/pg-core";
import { blogVersions } from "./blog-versions";
import { mediaAssets } from "./media-assets";

export const blogVersionMedia = pgTable(
  "blog_version_media",
  {
    blogVersionId: uuid("blog_version_id")
      .notNull()
      .references(() => blogVersions.id, { onDelete: "restrict" }),
    mediaAssetId: uuid("media_asset_id")
      .notNull()
      .references(() => mediaAssets.id, { onDelete: "restrict" }),
  },
  (table) => [
    primaryKey({ columns: [table.blogVersionId, table.mediaAssetId] }),
    index("blog_version_media_media_asset_id_idx").on(table.mediaAssetId),
  ]
);
