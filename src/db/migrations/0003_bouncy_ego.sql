ALTER TYPE "public"."listing_category" ADD VALUE 'homebuying' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."listing_category" ADD VALUE 'housing' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."listing_category" ADD VALUE 'insurance' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."listing_category" ADD VALUE 'transportation' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."listing_category" ADD VALUE 'education' BEFORE 'other';--> statement-breakpoint
CREATE TABLE "post_views" (
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"view_count" integer DEFAULT 1 NOT NULL,
	"viewed_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_views_user_id_post_id_pk" PRIMARY KEY("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "sms_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_message_id" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sms_notifications_one_per_user_per_post" UNIQUE("user_id","post_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_notifications" ADD CONSTRAINT "sms_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_notifications" ADD CONSTRAINT "sms_notifications_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_views_user_viewed_idx" ON "post_views" USING btree ("user_id","viewed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "sms_notifications_user_created_idx" ON "sms_notifications" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phone_e164" CHECK ("users"."phone" is null or "users"."phone" ~ '^\+[1-9][0-9]{7,14}$');--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_sms_opt_in_needs_phone" CHECK (not "users"."sms_opt_in" or "users"."phone" is not null);