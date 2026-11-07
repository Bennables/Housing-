CREATE TYPE "public"."notification_type" AS ENUM('new_listing', 'comment', 'like');--> statement-breakpoint
CREATE TYPE "public"."sms_status" AS ENUM('none', 'pending', 'sending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"actor_id" text,
	"listing_id" uuid,
	"post_id" uuid,
	"dedupe_key" text NOT NULL,
	"read_at" timestamp (3) with time zone,
	"sms_status" "sms_status" DEFAULT 'none' NOT NULL,
	"sms_sent_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_user_dedupe" UNIQUE("user_id","dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "sms_subscriptions" (
	"user_id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"consented_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sms_subscriptions_phone_e164" CHECK ("sms_subscriptions"."phone" ~ '^\+[1-9][0-9]{7,14}$')
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_subscriptions" ADD CONSTRAINT "sms_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_sms_pending_idx" ON "notifications" USING btree ("created_at") WHERE "notifications"."sms_status" = 'pending';