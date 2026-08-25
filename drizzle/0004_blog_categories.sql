CREATE TABLE "blog_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"color_class" varchar(40),
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "blogs" ADD COLUMN "category_id" uuid;
--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "blog_categories_slug_lower_idx" ON "blog_categories" USING btree (lower("slug"));
--> statement-breakpoint
CREATE INDEX "blog_categories_display_order_idx" ON "blog_categories" USING btree ("display_order");
--> statement-breakpoint
CREATE INDEX "blog_categories_deleted_at_idx" ON "blog_categories" USING btree ("deleted_at");
--> statement-breakpoint
CREATE INDEX "blogs_category_id_idx" ON "blogs" USING btree ("category_id");
--> statement-breakpoint
INSERT INTO "blog_categories" ("name", "slug", "color_class", "display_order")
VALUES
	('Proyecto', 'proyecto', 'proyecto', 10),
	('Taller', 'taller', 'taller', 20),
	('Deber', 'deber', 'deber', 30)
ON CONFLICT DO NOTHING;
