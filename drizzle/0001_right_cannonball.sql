CREATE TABLE "blog_publications" (
	"blog_id" uuid PRIMARY KEY NOT NULL,
	"blog_version_id" uuid NOT NULL,
	"published_by_user_id" uuid NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_version_media" (
	"blog_version_id" uuid NOT NULL,
	"media_asset_id" uuid NOT NULL,
	CONSTRAINT "blog_version_media_blog_version_id_media_asset_id_pk" PRIMARY KEY("blog_version_id","media_asset_id")
);
--> statement-breakpoint
CREATE TABLE "blog_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blog_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"summary" varchar(500) NOT NULL,
	"content_markdown" text NOT NULL,
	"cover_media_asset_id" uuid,
	"cover_alt_text" varchar(255),
	"edited_by_user_id" uuid NOT NULL,
	"change_summary" varchar(500),
	"restored_from_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_versions_blog_id_version_number_unique" UNIQUE("blog_id","version_number"),
	CONSTRAINT "blog_versions_blog_id_id_unique" UNIQUE("blog_id","id"),
	CONSTRAINT "blog_versions_version_number_check" CHECK ("blog_versions"."version_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "blogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cloudinary_asset_id" varchar(255) NOT NULL,
	"cloudinary_public_id" varchar(255) NOT NULL,
	"resource_type" varchar(30) NOT NULL,
	"format" varchar(20) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"size_bytes" bigint NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "media_assets_cloudinary_asset_id_unique" UNIQUE("cloudinary_asset_id"),
	CONSTRAINT "media_assets_cloudinary_public_id_unique" UNIQUE("cloudinary_public_id"),
	CONSTRAINT "media_assets_width_check" CHECK ("media_assets"."width" > 0),
	CONSTRAINT "media_assets_height_check" CHECK ("media_assets"."height" > 0),
	CONSTRAINT "media_assets_size_bytes_check" CHECK ("media_assets"."size_bytes" > 0)
);
--> statement-breakpoint
ALTER TABLE "blog_publications" ADD CONSTRAINT "blog_publications_blog_id_blogs_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_publications" ADD CONSTRAINT "blog_publications_published_by_user_id_users_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_publications" ADD CONSTRAINT "blog_publications_blog_id_blog_version_id_fk" FOREIGN KEY ("blog_id","blog_version_id") REFERENCES "public"."blog_versions"("blog_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_version_media" ADD CONSTRAINT "blog_version_media_blog_version_id_blog_versions_id_fk" FOREIGN KEY ("blog_version_id") REFERENCES "public"."blog_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_version_media" ADD CONSTRAINT "blog_version_media_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_versions" ADD CONSTRAINT "blog_versions_blog_id_blogs_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_versions" ADD CONSTRAINT "blog_versions_cover_media_asset_id_media_assets_id_fk" FOREIGN KEY ("cover_media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_versions" ADD CONSTRAINT "blog_versions_edited_by_user_id_users_id_fk" FOREIGN KEY ("edited_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_versions" ADD CONSTRAINT "blog_versions_restored_from_version_id_blog_versions_id_fk" FOREIGN KEY ("restored_from_version_id") REFERENCES "public"."blog_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_version_media_media_asset_id_idx" ON "blog_version_media" USING btree ("media_asset_id");--> statement-breakpoint
CREATE INDEX "blog_versions_edited_by_user_id_idx" ON "blog_versions" USING btree ("edited_by_user_id");--> statement-breakpoint
CREATE INDEX "blog_versions_created_at_idx" ON "blog_versions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blogs_slug_lower_idx" ON "blogs" USING btree (lower("slug"));--> statement-breakpoint
CREATE INDEX "blogs_created_by_user_id_idx" ON "blogs" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "media_assets_uploaded_by_user_id_idx" ON "media_assets" USING btree ("uploaded_by_user_id");