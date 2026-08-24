CREATE TABLE "contact_message_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_message_id" uuid NOT NULL,
	"sequence_number" integer NOT NULL,
	"status_id" smallint NOT NULL,
	"changed_by_user_id" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_message_status_history_message_seq_unique" UNIQUE("contact_message_id","sequence_number"),
	CONSTRAINT "contact_message_status_history_sequence_number_check" CHECK ("contact_message_status_history"."sequence_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "contact_message_statuses" (
	"id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "contact_message_statuses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"code" varchar(20) NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "contact_message_statuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_name" varchar(150) NOT NULL,
	"sender_email" varchar(255) NOT NULL,
	"subject" varchar(200) NOT NULL,
	"message_body" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_key" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_section_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_section_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"title" varchar(200),
	"content_markdown" text NOT NULL,
	"edited_by_user_id" uuid NOT NULL,
	"change_summary" varchar(500),
	"restored_from_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_section_versions_site_section_id_version_number_unique" UNIQUE("site_section_id","version_number"),
	CONSTRAINT "site_section_versions_version_number_check" CHECK ("site_section_versions"."version_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "site_profile_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_number" integer NOT NULL,
	"group_name" varchar(150) NOT NULL,
	"tagline" varchar(250),
	"logo_media_asset_id" uuid,
	"logo_alt_text" varchar(255),
	"public_email" varchar(255),
	"public_phone" varchar(30),
	"edited_by_user_id" uuid NOT NULL,
	"change_summary" varchar(500),
	"restored_from_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_profile_versions_version_number_unique" UNIQUE("version_number"),
	CONSTRAINT "site_profile_versions_version_number_check" CHECK ("site_profile_versions"."version_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "team_member_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"role_title" varchar(120),
	"bio_markdown" text,
	"photo_media_asset_id" uuid,
	"photo_alt_text" varchar(255),
	"github_url" varchar(500),
	"linkedin_url" varchar(500),
	"display_order" integer NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"edited_by_user_id" uuid NOT NULL,
	"change_summary" varchar(500),
	"restored_from_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_member_versions_team_member_id_version_number_unique" UNIQUE("team_member_id","version_number"),
	CONSTRAINT "team_member_versions_version_number_check" CHECK ("team_member_versions"."version_number" > 0),
	CONSTRAINT "team_member_versions_display_order_check" CHECK ("team_member_versions"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "social_platforms" (
	"id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "social_platforms_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"code" varchar(30) NOT NULL,
	"name" varchar(60) NOT NULL,
	CONSTRAINT "social_platforms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "site_social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_platform_id" smallint NOT NULL,
	"url" varchar(500) NOT NULL,
	"display_order" integer NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_social_links_social_platform_id_unique" UNIQUE("social_platform_id"),
	CONSTRAINT "site_social_links_display_order_check" CHECK ("site_social_links"."display_order" >= 0)
);
--> statement-breakpoint
ALTER TABLE "contact_message_status_history" ADD CONSTRAINT "contact_message_status_history_contact_message_id_contact_messages_id_fk" FOREIGN KEY ("contact_message_id") REFERENCES "public"."contact_messages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_message_status_history" ADD CONSTRAINT "contact_message_status_history_status_id_contact_message_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."contact_message_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_message_status_history" ADD CONSTRAINT "contact_message_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_section_versions" ADD CONSTRAINT "site_section_versions_site_section_id_site_sections_id_fk" FOREIGN KEY ("site_section_id") REFERENCES "public"."site_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_section_versions" ADD CONSTRAINT "site_section_versions_edited_by_user_id_users_id_fk" FOREIGN KEY ("edited_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_section_versions" ADD CONSTRAINT "site_section_versions_restored_from_version_id_site_section_versions_id_fk" FOREIGN KEY ("restored_from_version_id") REFERENCES "public"."site_section_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_profile_versions" ADD CONSTRAINT "site_profile_versions_logo_media_asset_id_media_assets_id_fk" FOREIGN KEY ("logo_media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_profile_versions" ADD CONSTRAINT "site_profile_versions_edited_by_user_id_users_id_fk" FOREIGN KEY ("edited_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_profile_versions" ADD CONSTRAINT "site_profile_versions_restored_from_version_id_site_profile_versions_id_fk" FOREIGN KEY ("restored_from_version_id") REFERENCES "public"."site_profile_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_versions" ADD CONSTRAINT "team_member_versions_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_versions" ADD CONSTRAINT "team_member_versions_photo_media_asset_id_media_assets_id_fk" FOREIGN KEY ("photo_media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_versions" ADD CONSTRAINT "team_member_versions_edited_by_user_id_users_id_fk" FOREIGN KEY ("edited_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_versions" ADD CONSTRAINT "team_member_versions_restored_from_version_id_team_member_versions_id_fk" FOREIGN KEY ("restored_from_version_id") REFERENCES "public"."team_member_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_social_links" ADD CONSTRAINT "site_social_links_social_platform_id_social_platforms_id_fk" FOREIGN KEY ("social_platform_id") REFERENCES "public"."social_platforms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_message_status_history_status_id_idx" ON "contact_message_status_history" USING btree ("status_id");--> statement-breakpoint
CREATE INDEX "contact_message_status_history_changed_at_idx" ON "contact_message_status_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "contact_messages_received_at_idx" ON "contact_messages" USING btree ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "site_sections_section_key_lower_idx" ON "site_sections" USING btree (lower("section_key"));--> statement-breakpoint
CREATE INDEX "site_section_versions_edited_by_user_id_idx" ON "site_section_versions" USING btree ("edited_by_user_id");--> statement-breakpoint
CREATE INDEX "site_section_versions_created_at_idx" ON "site_section_versions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "site_profile_versions_edited_by_user_id_idx" ON "site_profile_versions" USING btree ("edited_by_user_id");--> statement-breakpoint
CREATE INDEX "site_profile_versions_created_at_idx" ON "site_profile_versions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "team_member_versions_edited_by_user_id_idx" ON "team_member_versions" USING btree ("edited_by_user_id");--> statement-breakpoint
CREATE INDEX "team_member_versions_created_at_idx" ON "team_member_versions" USING btree ("created_at");