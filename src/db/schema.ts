import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  AGENCY_LEVELS,
  AUDIENCES,
  FREQUENCIES,
  LISTING_CATEGORIES,
  LISTING_LEVELS,
  LISTING_TYPES,
  USER_ROLES,
} from "@/lib/constants";

// Timestamps use millisecond precision so a JavaScript Date round-trips exactly.
// The feed cursor on (createdAt, id) depends on that.
const ts = (name: string) => timestamp(name, { mode: "date", withTimezone: true, precision: 3 });
const cents = (name: string) => bigint(name, { mode: "number" });

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", USER_ROLES);
export const frequencyEnum = pgEnum("frequency", FREQUENCIES);
export const agencyLevelEnum = pgEnum("agency_level", AGENCY_LEVELS);
export const listingTypeEnum = pgEnum("listing_type", LISTING_TYPES);
export const listingCategoryEnum = pgEnum("listing_category", LISTING_CATEGORIES);
export const listingLevelEnum = pgEnum("listing_level", LISTING_LEVELS);
export const audienceEnum = pgEnum("audience", AUDIENCES);

// ---------------------------------------------------------------------------
// Auth.js tables (standard @auth/drizzle-adapter shape, plus role and isAdmin on users)
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("unassigned"),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ---------------------------------------------------------------------------
// agencies
// ---------------------------------------------------------------------------

export const agencies = pgTable(
  "agencies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // The account that manages the agency. One agency per account.
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    level: agencyLevelEnum("level").notNull(),
    website: text("website").notNull(),
    // Only admins set this.
    verified: boolean("verified").notNull().default(false),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("agencies_verified_idx").on(t.verified)],
);

// ---------------------------------------------------------------------------
// listings (official opportunities)
// ---------------------------------------------------------------------------

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    // Null only for listings seeded or added by an admin.
    agencyId: uuid("agency_id").references(() => agencies.id),
    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    type: listingTypeEnum("type").notNull(),
    category: listingCategoryEnum("category").notNull(),
    level: listingLevelEnum("level").notNull(),
    summary: text("summary").notNull(),
    eligibility: text("eligibility"),
    url: text("url").notNull(),
    state: text("state"),
    targetAudience: audienceEnum("target_audience").notNull(),
    amountMinCents: cents("amount_min_cents"),
    amountMaxCents: cents("amount_max_cents"),
    frequency: frequencyEnum("frequency"),
    // Null means rolling. Open, upcoming and closed are computed from these at query time.
    opensAt: ts("opens_at"),
    closesAt: ts("closes_at"),
    sourceCheckedAt: date("source_checked_at", { mode: "string" }),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("listings_target_audience_idx").on(t.targetAudience),
    index("listings_agency_id_idx").on(t.agencyId),
    check(
      "listings_amount_needs_frequency",
      sql`(${t.amountMinCents} is null and ${t.amountMaxCents} is null) or ${t.frequency} is not null`,
    ),
    check(
      "listings_grant_benefit_need_frequency",
      sql`${t.type} not in ('grant', 'benefit') or ${t.frequency} is not null`,
    ),
    check(
      "listings_amounts_valid",
      sql`(${t.amountMinCents} is null or ${t.amountMinCents} > 0)
        and (${t.amountMaxCents} is null or ${t.amountMaxCents} > 0)
        and (${t.amountMinCents} is null or ${t.amountMaxCents} is null or ${t.amountMinCents} <= ${t.amountMaxCents})`,
    ),
    check(
      "listings_dates_ordered",
      sql`${t.opensAt} is null or ${t.closesAt} is null or ${t.closesAt} >= ${t.opensAt}`,
    ),
    check("listings_state_code", sql`${t.state} is null or ${t.state} ~ '^[A-Z]{2}$'`),
    check(
      "listings_eligibility_length",
      sql`${t.eligibility} is null or char_length(${t.eligibility}) <= 2000`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// posts (community shares)
// ---------------------------------------------------------------------------

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    // When set, the post embeds that listing's card and shows the listing's own amounts.
    listingId: uuid("listing_id").references(() => listings.id),
    // Only for unlisted opportunities.
    benefitCents: cents("benefit_cents"),
    benefitFrequency: frequencyEnum("benefit_frequency"),
    eligibility: text("eligibility"),
    states: text("states")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    sourceUrl: text("source_url"),
    targetAudience: audienceEnum("target_audience").notNull().default("both"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("posts_feed_idx").on(t.createdAt.desc(), t.id.desc()),
    index("posts_audience_created_idx").on(t.targetAudience, t.createdAt.desc()),
    index("posts_listing_id_idx").on(t.listingId),
    check("posts_body_length", sql`char_length(${t.body}) between 1 and 3000`),
    check("posts_benefit_pair", sql`(${t.benefitCents} is null) = (${t.benefitFrequency} is null)`),
    check("posts_benefit_positive", sql`${t.benefitCents} is null or ${t.benefitCents} > 0`),
    check(
      "posts_eligibility_length",
      sql`${t.eligibility} is null or char_length(${t.eligibility}) <= 2000`,
    ),
    check("posts_listing_or_source", sql`${t.listingId} is not null or ${t.sourceUrl} is not null`),
    check(
      "posts_amounts_only_when_unlisted",
      sql`${t.listingId} is null or (${t.benefitCents} is null and ${t.eligibility} is null)`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Everything else
// ---------------------------------------------------------------------------

export const savedListings = pgTable(
  "saved_listings",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.listingId] })],
);

export const savedPosts = pgTable(
  "saved_posts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.postId] })],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("comments_post_id_idx").on(t.postId),
    check("comments_body_length", sql`char_length(${t.body}) between 1 and 1000`),
  ],
);

export const likes = pgTable(
  "likes",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const capitalStacks = pgTable(
  "capital_stacks",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    projectName: text("project_name").notNull(),
    totalCostCents: cents("total_cost_cents").notNull(),
    firstMortgageCents: cents("first_mortgage_cents"),
  },
  (t) => [
    check("capital_stacks_total_positive", sql`${t.totalCostCents} > 0`),
    check(
      "capital_stacks_mortgage_positive",
      sql`${t.firstMortgageCents} is null or ${t.firstMortgageCents} > 0`,
    ),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("reports_one_per_user_per_post").on(t.postId, t.reporterId),
    index("reports_post_id_idx").on(t.postId),
  ],
);

export type User = typeof users.$inferSelect;
export type Agency = typeof agencies.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
