CREATE TYPE "public"."email_status" AS ENUM('none', 'pending', 'sending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "email_subscriptions" (
	"user_id" text PRIMARY KEY NOT NULL,
	"consented_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sms_subscriptions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "sms_subscriptions" CASCADE;--> statement-breakpoint
DROP INDEX "notifications_sms_pending_idx";--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "email_status" "email_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "email_sent_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "email_subscriptions" ADD CONSTRAINT "email_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_email_pending_idx" ON "notifications" USING btree ("created_at") WHERE "notifications"."email_status" = 'pending';--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "sms_status";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "sms_sent_at";--> statement-breakpoint
DROP TYPE "public"."sms_status";