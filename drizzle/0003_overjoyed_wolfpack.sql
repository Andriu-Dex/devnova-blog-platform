CREATE TABLE "audit_action_types" (
	"id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_action_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"code" varchar(40) NOT NULL,
	"name" varchar(80) NOT NULL,
	CONSTRAINT "audit_action_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "audit_auth_events" (
	"audit_event_id" uuid PRIMARY KEY NOT NULL,
	"attempted_username" varchar(80) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_blog_events" (
	"audit_event_id" uuid PRIMARY KEY NOT NULL,
	"blog_id" uuid NOT NULL,
	"previous_version_id" uuid,
	"new_version_id" uuid
);
--> statement-breakpoint
CREATE TABLE "audit_contact_message_events" (
	"audit_event_id" uuid PRIMARY KEY NOT NULL,
	"contact_message_id" uuid NOT NULL,
	"previous_status_history_id" uuid,
	"new_status_history_id" uuid
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action_type_id" smallint NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"ip_address" "inet",
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "audit_media_events" (
	"audit_event_id" uuid PRIMARY KEY NOT NULL,
	"media_asset_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_site_profile_events" (
	"audit_event_id" uuid PRIMARY KEY NOT NULL,
	"previous_version_id" uuid,
	"new_version_id" uuid
);
--> statement-breakpoint
CREATE TABLE "audit_site_section_events" (
	"audit_event_id" uuid PRIMARY KEY NOT NULL,
	"site_section_id" uuid NOT NULL,
	"previous_version_id" uuid,
	"new_version_id" uuid
);
--> statement-breakpoint
CREATE TABLE "audit_site_social_link_events" (
	"audit_event_id" uuid PRIMARY KEY NOT NULL,
	"site_social_link_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_team_member_events" (
	"audit_event_id" uuid PRIMARY KEY NOT NULL,
	"team_member_id" uuid NOT NULL,
	"previous_version_id" uuid,
	"new_version_id" uuid
);
--> statement-breakpoint
CREATE TABLE "audit_user_events" (
	"audit_event_id" uuid PRIMARY KEY NOT NULL,
	"target_user_id" uuid NOT NULL,
	"previous_status_id" smallint,
	"new_status_id" smallint
);
--> statement-breakpoint
ALTER TABLE "audit_auth_events" ADD CONSTRAINT "audit_auth_events_audit_event_id_audit_events_id_fk" FOREIGN KEY ("audit_event_id") REFERENCES "public"."audit_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_blog_events" ADD CONSTRAINT "audit_blog_events_audit_event_id_audit_events_id_fk" FOREIGN KEY ("audit_event_id") REFERENCES "public"."audit_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_blog_events" ADD CONSTRAINT "audit_blog_events_blog_id_blogs_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_blog_events" ADD CONSTRAINT "audit_blog_events_prev_fk" FOREIGN KEY ("blog_id","previous_version_id") REFERENCES "public"."blog_versions"("blog_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_blog_events" ADD CONSTRAINT "audit_blog_events_new_fk" FOREIGN KEY ("blog_id","new_version_id") REFERENCES "public"."blog_versions"("blog_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_contact_message_events" ADD CONSTRAINT "audit_contact_message_events_audit_event_id_audit_events_id_fk" FOREIGN KEY ("audit_event_id") REFERENCES "public"."audit_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_contact_message_events" ADD CONSTRAINT "audit_contact_message_events_contact_message_id_contact_messages_id_fk" FOREIGN KEY ("contact_message_id") REFERENCES "public"."contact_messages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_contact_message_events" ADD CONSTRAINT "audit_contact_message_events_previous_status_history_id_contact_message_status_history_id_fk" FOREIGN KEY ("previous_status_history_id") REFERENCES "public"."contact_message_status_history"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_contact_message_events" ADD CONSTRAINT "audit_contact_message_events_new_status_history_id_contact_message_status_history_id_fk" FOREIGN KEY ("new_status_history_id") REFERENCES "public"."contact_message_status_history"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_action_type_id_audit_action_types_id_fk" FOREIGN KEY ("action_type_id") REFERENCES "public"."audit_action_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_media_events" ADD CONSTRAINT "audit_media_events_audit_event_id_audit_events_id_fk" FOREIGN KEY ("audit_event_id") REFERENCES "public"."audit_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_media_events" ADD CONSTRAINT "audit_media_events_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_site_profile_events" ADD CONSTRAINT "audit_site_profile_events_audit_event_id_audit_events_id_fk" FOREIGN KEY ("audit_event_id") REFERENCES "public"."audit_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_site_profile_events" ADD CONSTRAINT "audit_site_profile_events_previous_version_id_site_profile_versions_id_fk" FOREIGN KEY ("previous_version_id") REFERENCES "public"."site_profile_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_site_profile_events" ADD CONSTRAINT "audit_site_profile_events_new_version_id_site_profile_versions_id_fk" FOREIGN KEY ("new_version_id") REFERENCES "public"."site_profile_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_site_section_events" ADD CONSTRAINT "audit_site_section_events_audit_event_id_audit_events_id_fk" FOREIGN KEY ("audit_event_id") REFERENCES "public"."audit_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_site_section_events" ADD CONSTRAINT "audit_site_section_events_site_section_id_site_sections_id_fk" FOREIGN KEY ("site_section_id") REFERENCES "public"."site_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_site_section_events" ADD CONSTRAINT "audit_site_section_events_previous_version_id_site_section_versions_id_fk" FOREIGN KEY ("previous_version_id") REFERENCES "public"."site_section_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_site_section_events" ADD CONSTRAINT "audit_site_section_events_new_version_id_site_section_versions_id_fk" FOREIGN KEY ("new_version_id") REFERENCES "public"."site_section_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_site_social_link_events" ADD CONSTRAINT "audit_site_social_link_events_audit_event_id_audit_events_id_fk" FOREIGN KEY ("audit_event_id") REFERENCES "public"."audit_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_site_social_link_events" ADD CONSTRAINT "audit_site_social_link_events_site_social_link_id_site_social_links_id_fk" FOREIGN KEY ("site_social_link_id") REFERENCES "public"."site_social_links"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_team_member_events" ADD CONSTRAINT "audit_team_member_events_audit_event_id_audit_events_id_fk" FOREIGN KEY ("audit_event_id") REFERENCES "public"."audit_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_team_member_events" ADD CONSTRAINT "audit_team_member_events_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_team_member_events" ADD CONSTRAINT "audit_team_member_events_previous_version_id_team_member_versions_id_fk" FOREIGN KEY ("previous_version_id") REFERENCES "public"."team_member_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_team_member_events" ADD CONSTRAINT "audit_team_member_events_new_version_id_team_member_versions_id_fk" FOREIGN KEY ("new_version_id") REFERENCES "public"."team_member_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_user_events" ADD CONSTRAINT "audit_user_events_audit_event_id_audit_events_id_fk" FOREIGN KEY ("audit_event_id") REFERENCES "public"."audit_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_user_events" ADD CONSTRAINT "audit_user_events_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_user_events" ADD CONSTRAINT "audit_user_events_previous_status_id_user_statuses_id_fk" FOREIGN KEY ("previous_status_id") REFERENCES "public"."user_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_user_events" ADD CONSTRAINT "audit_user_events_new_status_id_user_statuses_id_fk" FOREIGN KEY ("new_status_id") REFERENCES "public"."user_statuses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_blog_events_blog_id_idx" ON "audit_blog_events" USING btree ("blog_id");--> statement-breakpoint
CREATE INDEX "audit_contact_message_events_contact_message_id_idx" ON "audit_contact_message_events" USING btree ("contact_message_id");--> statement-breakpoint
CREATE INDEX "audit_events_actor_user_id_idx" ON "audit_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_events_action_type_id_idx" ON "audit_events" USING btree ("action_type_id");--> statement-breakpoint
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "audit_media_events_media_asset_id_idx" ON "audit_media_events" USING btree ("media_asset_id");--> statement-breakpoint
CREATE INDEX "audit_site_section_events_site_section_id_idx" ON "audit_site_section_events" USING btree ("site_section_id");--> statement-breakpoint
CREATE INDEX "audit_site_social_link_events_site_social_link_id_idx" ON "audit_site_social_link_events" USING btree ("site_social_link_id");--> statement-breakpoint
CREATE INDEX "audit_team_member_events_team_member_id_idx" ON "audit_team_member_events" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "audit_user_events_target_user_id_idx" ON "audit_user_events" USING btree ("target_user_id");