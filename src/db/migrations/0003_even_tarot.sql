CREATE TYPE "public"."project_type" AS ENUM('rental', 'ownership');--> statement-breakpoint
ALTER TYPE "public"."listing_type" ADD VALUE 'down_payment' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."listing_type" ADD VALUE 'lender' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."listing_type" ADD VALUE 'employer' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."listing_type" ADD VALUE 'donor' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."listing_type" ADD VALUE 'earned_revenue' BEFORE 'other';--> statement-breakpoint
CREATE TABLE "stack_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"source_type" "listing_type" NOT NULL,
	"name" text NOT NULL,
	"amount_cents" bigint,
	"frequency" "frequency",
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stack_sources_name_length" CHECK (char_length("stack_sources"."name") between 1 and 120),
	CONSTRAINT "stack_sources_amount_positive" CHECK ("stack_sources"."amount_cents" is null or "stack_sources"."amount_cents" > 0),
	CONSTRAINT "stack_sources_amount_pair" CHECK (("stack_sources"."amount_cents" is null) = ("stack_sources"."frequency" is null))
);
--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD COLUMN "project_type" "project_type" DEFAULT 'rental' NOT NULL;--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD COLUMN "unit_count" integer;--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD COLUMN "area_median_income_cents" bigint;--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD COLUMN "ami_percent" integer;--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD COLUMN "housing_cost_percent" integer;--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD COLUMN "interest_rate_bps" integer;--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD COLUMN "down_payment_bps" integer;--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD COLUMN "other_monthly_costs_cents" bigint;--> statement-breakpoint
ALTER TABLE "stack_sources" ADD CONSTRAINT "stack_sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stack_sources_user_idx" ON "stack_sources" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD CONSTRAINT "capital_stacks_ownership_inputs" CHECK ("capital_stacks"."project_type" <> 'ownership' or (
        "capital_stacks"."unit_count" is not null and "capital_stacks"."area_median_income_cents" is not null
        and "capital_stacks"."ami_percent" is not null and "capital_stacks"."housing_cost_percent" is not null
        and "capital_stacks"."interest_rate_bps" is not null and "capital_stacks"."down_payment_bps" is not null));--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD CONSTRAINT "capital_stacks_unit_count" CHECK ("capital_stacks"."unit_count" is null or "capital_stacks"."unit_count" between 1 and 10000);--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD CONSTRAINT "capital_stacks_ami_positive" CHECK ("capital_stacks"."area_median_income_cents" is null or "capital_stacks"."area_median_income_cents" > 0);--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD CONSTRAINT "capital_stacks_ami_percent" CHECK ("capital_stacks"."ami_percent" is null or "capital_stacks"."ami_percent" in (30, 50, 60, 80, 100, 120));--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD CONSTRAINT "capital_stacks_housing_cost_percent" CHECK ("capital_stacks"."housing_cost_percent" is null or "capital_stacks"."housing_cost_percent" between 30 and 35);--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD CONSTRAINT "capital_stacks_interest_rate" CHECK ("capital_stacks"."interest_rate_bps" is null or "capital_stacks"."interest_rate_bps" between 0 and 2000);--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD CONSTRAINT "capital_stacks_down_payment" CHECK ("capital_stacks"."down_payment_bps" is null or "capital_stacks"."down_payment_bps" between 0 and 5000);--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD CONSTRAINT "capital_stacks_other_monthly" CHECK ("capital_stacks"."other_monthly_costs_cents" is null or "capital_stacks"."other_monthly_costs_cents" >= 0);