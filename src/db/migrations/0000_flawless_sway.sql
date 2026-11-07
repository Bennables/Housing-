CREATE TYPE "public"."agency_level" AS ENUM('federal', 'state', 'county', 'city', 'nonprofit');--> statement-breakpoint
CREATE TYPE "public"."audience" AS ENUM('builder', 'household', 'both');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('one_time', 'weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."listing_category" AS ENUM('food', 'health', 'utilities', 'rent', 'childcare', 'income', 'development', 'adu', 'other');--> statement-breakpoint
CREATE TYPE "public"."listing_level" AS ENUM('federal', 'state', 'county', 'city');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('grant', 'benefit', 'loan', 'tax_credit', 'zoning_bonus', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('unassigned', 'household', 'builder', 'agency');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"level" "agency_level" NOT NULL,
	"website" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agencies_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "capital_stacks" (
	"user_id" text PRIMARY KEY NOT NULL,
	"project_name" text NOT NULL,
	"total_cost_cents" bigint NOT NULL,
	"first_mortgage_cents" bigint,
	CONSTRAINT "capital_stacks_total_positive" CHECK ("capital_stacks"."total_cost_cents" > 0),
	CONSTRAINT "capital_stacks_mortgage_positive" CHECK ("capital_stacks"."first_mortgage_cents" is null or "capital_stacks"."first_mortgage_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comments_body_length" CHECK (char_length("comments"."body") between 1 and 1000)
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"post_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "likes_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"agency_id" uuid,
	"created_by_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "listing_type" NOT NULL,
	"category" "listing_category" NOT NULL,
	"level" "listing_level" NOT NULL,
	"summary" text NOT NULL,
	"eligibility" text,
	"url" text NOT NULL,
	"state" text,
	"target_audience" "audience" NOT NULL,
	"amount_min_cents" bigint,
	"amount_max_cents" bigint,
	"frequency" "frequency",
	"opens_at" timestamp (3) with time zone,
	"closes_at" timestamp (3) with time zone,
	"source_checked_at" date,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listings_slug_unique" UNIQUE("slug"),
	CONSTRAINT "listings_amount_needs_frequency" CHECK (("listings"."amount_min_cents" is null and "listings"."amount_max_cents" is null) or "listings"."frequency" is not null),
	CONSTRAINT "listings_grant_benefit_need_frequency" CHECK ("listings"."type" not in ('grant', 'benefit') or "listings"."frequency" is not null),
	CONSTRAINT "listings_amounts_valid" CHECK (("listings"."amount_min_cents" is null or "listings"."amount_min_cents" > 0)
        and ("listings"."amount_max_cents" is null or "listings"."amount_max_cents" > 0)
        and ("listings"."amount_min_cents" is null or "listings"."amount_max_cents" is null or "listings"."amount_min_cents" <= "listings"."amount_max_cents")),
	CONSTRAINT "listings_dates_ordered" CHECK ("listings"."opens_at" is null or "listings"."closes_at" is null or "listings"."closes_at" >= "listings"."opens_at"),
	CONSTRAINT "listings_state_code" CHECK ("listings"."state" is null or "listings"."state" ~ '^[A-Z]{2}$'),
	CONSTRAINT "listings_eligibility_length" CHECK ("listings"."eligibility" is null or char_length("listings"."eligibility") <= 2000)
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"listing_id" uuid,
	"benefit_cents" bigint,
	"benefit_frequency" "frequency",
	"eligibility" text,
	"states" text[] DEFAULT '{}'::text[] NOT NULL,
	"source_url" text,
	"target_audience" "audience" DEFAULT 'both' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_body_length" CHECK (char_length("posts"."body") between 1 and 3000),
	CONSTRAINT "posts_benefit_pair" CHECK (("posts"."benefit_cents" is null) = ("posts"."benefit_frequency" is null)),
	CONSTRAINT "posts_benefit_positive" CHECK ("posts"."benefit_cents" is null or "posts"."benefit_cents" > 0),
	CONSTRAINT "posts_eligibility_length" CHECK ("posts"."eligibility" is null or char_length("posts"."eligibility") <= 2000),
	CONSTRAINT "posts_listing_or_source" CHECK ("posts"."listing_id" is not null or "posts"."source_url" is not null),
	CONSTRAINT "posts_amounts_only_when_unlisted" CHECK ("posts"."listing_id" is null or ("posts"."benefit_cents" is null and "posts"."eligibility" is null))
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_one_per_user_per_post" UNIQUE("post_id","reporter_id")
);
--> statement-breakpoint
CREATE TABLE "saved_listings" (
	"user_id" text NOT NULL,
	"listing_id" uuid NOT NULL,
	CONSTRAINT "saved_listings_user_id_listing_id_pk" PRIMARY KEY("user_id","listing_id")
);
--> statement-breakpoint
CREATE TABLE "saved_posts" (
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	CONSTRAINT "saved_posts_user_id_post_id_pk" PRIMARY KEY("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	"role" "user_role" DEFAULT 'unassigned' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capital_stacks" ADD CONSTRAINT "capital_stacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agencies_verified_idx" ON "agencies" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "comments_post_id_idx" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "listings_target_audience_idx" ON "listings" USING btree ("target_audience");--> statement-breakpoint
CREATE INDEX "listings_agency_id_idx" ON "listings" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "posts_feed_idx" ON "posts" USING btree ("created_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "posts_audience_created_idx" ON "posts" USING btree ("target_audience","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "posts_listing_id_idx" ON "posts" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "reports_post_id_idx" ON "reports" USING btree ("post_id");