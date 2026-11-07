# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, etc.) working in this repo. Read this whole file before making changes. If this file and the code disagree, ask before "fixing" either one.

## Project context

**Hackathon:** Hack for Good, Lane 3 ("Fund it: Does it pencil, and who closes the gap?")

Affordable housing does not pencil because capped rents cannot repay construction costs. That leaves a **funding gap**. Every project has one, and today the capital stack is assembled by hand, one project at a time. We want to make the gap smaller, or make the money that closes it easier to find.

## Our approach

A dual-sided platform that attacks the funding gap from both ends:

| Side | Who | What they get | How it closes the gap |
|------|-----|---------------|------------------------|
| **Household** | Low-income renters | One place to discover consumer programs (SNAP/CalFresh, Medi-Cal, WIC, LIHEAP, EITC, Section 8) | Programs cover other costs, which frees household money for rent and raises ability to pay |
| **Builder** | Affordable housing developers, nonprofits, small ADU builders | Tailored access to grants, loans, zoning/density bonuses, and development funds | Directly fills their capital stack |

Core features:

There are two kinds of content, and agents must never blur them:

| | **Listing** | **Post** |
|---|---|---|
| What it is | The official opportunity (a grant, benefit, loan, or bonus) | A person sharing about an opportunity ("Applications for X open Monday, here's how I applied") |
| Who creates it | Verified **agencies** (government offices, housing authorities, nonprofits that run the program). Admins can also add seed listings. | **Anyone** who is signed in |
| Where it appears | **Listings** tab | **Feed** tab |
| Trust level | Official, shows a "Verified agency" badge | Community, shows a "Community post" label |

- **Feed:** a LinkedIn-style feed of posts. A post can share a listing, which renders as an embedded listing card inside the post.
- **Listings:** a browsable catalog of official opportunities, with current and past (closed) listings.
- **Community sourcing:** when someone spots a new local grant that isn't listed yet, they post about it with a source link. Admins or the agency can then turn it into an official listing. This lets the platform scale without heavy admin work.
- **Trust:** every listing and post shows a **Source** badge linking to an official URL.
- **My Capital Stack:** a builder sidebar that totals saved funding against their project cost to visualize the gap closing.

### Out of scope for the hackathon

Payments, identity verification, submitting applications for users, DMs, native mobile apps.

## Architecture

- **Framework:** Next.js App Router, TypeScript (strict), Tailwind CSS, shadcn/ui
- **Database:** Neon Postgres (installed from the Vercel Marketplace), Drizzle ORM
- **Auth:** Auth.js v5 (`next-auth@5`) with the Drizzle adapter and database sessions stored in Postgres. Google is the sign-in provider; add more Auth.js providers in `src/lib/auth.ts` only if the team asks.
- **Hosting:** Vercel
- **Reads:** Server Components query the database directly
- **Writes:** Server Actions handle all mutations
- **No separate API server.** Do not add FastAPI, Express, or `/api` route handlers unless a feature truly needs one (Auth.js's own route handler is the exception).

## Repository structure

```
src/
├── app/
│   ├── (public)/              # feed and listings, readable without sign-in
│   │   ├── feed/
│   │   └── listings/
│   ├── onboarding/            # role picker (Server Component)
│   ├── agency/                # agency dashboard: create/edit/close listings
│   ├── admin/                 # verify agencies, review reports
│   ├── api/auth/[...nextauth]/route.ts
│   └── layout.tsx
├── components/                # shared UI (SourceBadge, PostCard, ListingCard, CapitalStackSidebar)
├── components/ui/             # shadcn/ui generated components (do not hand-edit)
├── db/
│   ├── schema.ts              # all Drizzle tables, enums, indexes
│   ├── index.ts               # db client
│   ├── migrations/            # drizzle-kit output (never edit applied migrations)
│   └── seed.ts                # seed script
├── lib/
│   ├── actions/               # Server Actions, one file per resource
│   ├── validation/            # zod schemas shared by forms and actions
│   └── auth.ts                # Auth.js config
└── middleware.ts
tests/                         # unit + integration (Vitest)
e2e/                           # Playwright
```

## Data model

All tables live in `src/db/schema.ts`.

### Auth.js tables

`users`, `accounts`, `sessions`, `verificationTokens` (standard Drizzle adapter shape).

`users` adds:
- `role` enum: `builder` | `household` | `agency` | `unassigned`, default `unassigned`
- `isAdmin` boolean, default `false` (moderates posts, verifies agencies, manages seed listings)

### Shared enum: frequency

`frequency`: `one_time` | `weekly` | `monthly` | `quarterly` | `yearly`

Used by every dollar amount on listings and posts. An amount is meaningless without its frequency, so amounts and frequency are always set together or both null (enforce with a check constraint).

### agencies

| Column | Notes |
|--------|-------|
| id | uuid |
| userId | fk users, the account that manages it |
| name | e.g., "OC Housing Finance Trust" |
| level | `federal` \| `state` \| `county` \| `city` \| `nonprofit` |
| website | official domain, required |
| verified | boolean, default `false`; only admins set it |
| createdAt | |

### listings (official opportunities)

| Column | Notes |
|--------|-------|
| id | uuid |
| slug | unique |
| agencyId | fk agencies, nullable only for admin-seeded listings |
| createdById | fk users |
| name | |
| type | `grant` \| `benefit` \| `loan` \| `tax_credit` \| `zoning_bonus` \| `other` |
| category | text enum (e.g., food, health, utilities, rent, childcare, development, adu) |
| level | `federal` \| `state` \| `county` \| `city` |
| summary | plain English |
| eligibility | plain English, under 2000 chars |
| url | official source, required |
| state | nullable for federal listings |
| targetAudience | `builder` \| `household` \| `both` |
| amountMinCents, amountMaxCents | nullable integers |
| frequency | `frequency` enum; **required when type is `grant` or `benefit`**, and whenever an amount is set (check constraint) |
| opensAt, closesAt | nullable timestamps; null = rolling |
| sourceCheckedAt | date the info was last verified |
| createdAt, updatedAt | |

Compute open/upcoming/closed/rolling status at query time from the dates. Do not store it.

Example frequencies: CalFresh = `monthly`, EITC = `yearly`, CalHFA ADU Grant = `one_time`, LIHEAP = `yearly` (or `one_time` per season; confirm at source).

### Seed listings

**Builder:**
- LIHTC (9% and 4%) *(moved here: LIHTC is a tax credit for developers, not households)*
- National Housing Trust Fund
- HCD CalHome Program
- CalHFA ADU Grant Program
- OC Housing Finance Trust ADU Loan
- California State Density Bonus Law, as a `zoning_bonus` item *(added: the plan promises zoning bonuses)*

**Household:**
- Section 8 Housing Choice Vouchers
- CalFresh *(this is California's name for SNAP; seed it once, mention SNAP in the summary)*
- WIC
- Medi-Cal
- LIHEAP
- EITC and CalEITC

Seed listings are created by an admin with `agencyId` null and display the program's official agency name from the URL. Also seed 2 demo agencies (one verified, one pending) and a few posts that share listings.

Include at least one closed listing per side so the past view has content. **Every amount, frequency, date, and eligibility fact must come from the official URL.** If unsure, leave it null and add `// TODO(verify)`.

### posts (community shares)

A post is a person talking about an opportunity. It is never itself the official opportunity.

| Column | Notes |
|--------|-------|
| id | uuid |
| authorId | fk users (any role) |
| body | 1 to 3000 chars |
| listingId | fk listings, nullable; when set, the post embeds that listing's card |
| benefitCents | positive integer, nullable; only for unlisted opportunities |
| benefitFrequency | `frequency` enum, nullable |
| eligibility | under 2000 chars, nullable; only for unlisted opportunities |
| states | text[] of valid 2-letter US state codes |
| sourceUrl | nullable |
| targetAudience | `builder` \| `household` \| `both` |
| createdAt | default now |

Check constraints:
- `benefitCents` and `benefitFrequency` are both set or both null.
- A post has a `listingId` or a `sourceUrl` (or both).

When a post shares a listing, show the **listing's** amount, frequency, and eligibility from the listings table, not copies on the post. This keeps one source of truth.

### Other tables

- **saved_listings:** `userId`, `listingId`, composite PK
- **saved_posts:** `userId`, `postId`, composite PK (lets builders save unlisted opportunities into their stack)
- **comments:** `id`, `postId`, `authorId`, `body`, `createdAt`
- **likes:** `postId`, `userId`, composite PK
- **capital_stacks:** `userId` (PK), `projectName`, `totalCostCents`, `firstMortgageCents` (nullable) *(added: the "gap" needs a project cost to measure against)*
- **reports:** `id`, `postId`, `reporterId`, `reason`, `createdAt` *(added: lightweight moderation for community-sourced posts)*

### Indexes

`posts(createdAt desc, id)` for the feed cursor, `comments(postId)`, `posts(targetAudience, createdAt)`, `posts(listingId)`, `listings(targetAudience)`, `listings(agencyId)`.

## Features

### Onboarding
- On first sign-in, `role` is `unassigned`. The user must choose **Builder**, **Household**, or **I represent an agency** at `/onboarding` before using any signed-in action.
- Choosing agency creates an `agencies` row with `verified = false`. Unverified agencies can draft listings, but drafts are not public until an admin verifies the agency.
- Enforce onboarding in the signed-in route layout (a Server Component that reads the session and redirects), **not** with a database query in middleware. Middleware should only do cheap checks.
- Builder and household users can switch between those two roles from their profile. Becoming an agency always goes through verification.

### Listings (official opportunities)
- Shows listings filtered by the user's role (`targetAudience = role` or `both`). Agencies and signed-out users see a Builder/Household toggle.
- Filters: type, category, level, state, frequency, status (open/upcoming/closed/rolling).
- Each card shows the agency name with a "Verified agency" badge, the Source badge, amount with frequency (e.g., "Up to $292/month", "$40,000 one-time"), deadline, and "last verified" date.
- Every listing page has a "Share" button that opens the Composer with the listing attached.

### Agency dashboard (`/agency`)
- Verified agencies create, edit, and close their own listings. Closing sets `closesAt`; listings are never hard-deleted, so they appear under past listings.
- Shows how many posts share each listing and how many users saved it.
- Server Actions check: user role is `agency`, the agency is verified, and the listing belongs to that agency.

### Feed (community posts)
- Posts, newest first, cursor pagination on `(createdAt, id)`, filtered by role the same way as Listings.
- Posts that share a listing render an embedded `ListingCard`. Posts without one show a "Community post, verify at source" label next to the Source badge.
- Like, comment, delete own post, report a post. Admins can delete any post.
- Agencies can post too (e.g., announcing a deadline). Their posts show the agency badge but are still posts, not listings.

### Composer
- Any signed-in user. Fields: body, attached listing (search picker), state tags, source URL.
- If **no listing is attached**, show extra fields for an unlisted opportunity: benefit amount, frequency, and eligibility.
- Validate with zod on both the client and in the Server Action: body 1 to 3000 chars, amount positive, amount and frequency set together, eligibility under 2000 chars, valid state codes, and a listing or source URL required.
- Store dollars as integer cents. Convert only at the UI boundary.

### Admin (`/admin`)
- Verify or reject pending agencies.
- Review reported posts.
- Promote a community post about an unlisted opportunity into a listing (prefills the listing form from the post).

### My Capital Stack (builders)
- Persistent sidebar on builder pages.
- Builder enters project name and total development cost (and optionally the first mortgage).
- Saved listings and posts are listed with their amounts and frequency. Show **remaining gap = total cost − mortgage − saved one-time funding**, as a stacked bar.
- **Never add amounts with different frequencies together.** One-time amounts count toward the gap. Recurring amounts are listed separately as recurring support. Items with unknown amounts are shown but not counted.
- Label totals as "potential funding". Saving a listing does not mean the builder will get it.

### Household view (stretch)
- Households saving listings see an estimate of monthly money freed up for rent. Convert recurring amounts to monthly (weekly × 52 / 12, quarterly / 3, yearly / 12) and show one-time amounts separately.

### Signed-out users
- Can read Feed and Listings. Any action (post, like, comment, save) prompts sign-in.

## Vercel + Neon rules

- Use the Neon serverless driver (`@neondatabase/serverless`) with Drizzle. Use the **pooled** `DATABASE_URL` at runtime.
- Use `DATABASE_URL_UNPOOLED` for `drizzle-kit` migrations.
- Migrations run before `next build`. Enable Neon **preview branches** in the Vercel integration so preview deployments migrate their own branch and never touch production data.
- Server Actions must check the session and role themselves. Never trust hidden form fields for `authorId` or role.
- No local filesystem writes and no in-memory state that must survive between requests.

## Environment variables

```
DATABASE_URL            # Neon pooled (set by Vercel Marketplace integration)
DATABASE_URL_UNPOOLED   # Neon direct, for migrations
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
```

Never commit `.env*` files except `.env.example`. Update `.env.example` whenever you add a variable.

## Commands

```bash
pnpm install
pnpm dev            # local dev server
pnpm build          # runs db:migrate, then next build
pnpm lint
pnpm typecheck
pnpm test           # Vitest
pnpm e2e            # Playwright
pnpm db:generate    # drizzle-kit generate
pnpm db:migrate     # drizzle-kit migrate
pnpm db:seed        # tsx src/db/seed.ts
```

## Conventions

- Package manager is **pnpm**. Do not add npm or yarn lockfiles.
- TypeScript strict mode. No `any` without a comment explaining why.
- Server Actions live in `src/lib/actions/`, return `{ ok: true, data } | { ok: false, error }`, and call `revalidatePath` after writes.
- Validation schemas live in `src/lib/validation/` and are shared by forms and actions.
- Use shadcn/ui components before writing custom ones.
- Every schema change gets a generated migration. Never edit an applied migration.
- Lint, typecheck, and tests must pass before any commit.
- Commit messages are small, imperative, and **never carry AI co-author trailers**.

## Data accuracy and safety rules

This app deals with real benefits and low-income users. These rules are not optional:

- **Never invent programs, amounts, deadlines, or eligibility rules.** Seed data must come from official sources.
- Show a visible disclaimer on Listings and post pages: "Information may change. Always confirm eligibility on the official site." The app does not give legal or financial advice.
- **Collect minimal personal data.** Never ask for or store SSNs, bank details, immigration status, or exact income.
- Clearly separate listings (official, from verified agencies) from posts (community, unverified). Never let a post display a "Verified" badge unless it is authored by a verified agency, and even then label it as a post.
- Use plain language (about 8th-grade reading level) in all user-facing copy.

## Testing

- Unit test validation schemas and capital stack math, including mixed frequencies, unknown amounts, and gaps that go negative (overfunded).
- Integration test each Server Action for: signed out, wrong role, unverified agency, another agency's listing, invalid input, and the happy path.
- E2E (Playwright):
  - builder: sign-in → onboarding → browse listings → save listing → capital stack updates
  - agency: onboarding as agency → admin verifies → create listing → it appears in Listings
  - any user: share a listing → post appears in Feed with the embedded listing card

## Open questions

- Does `both` audience content appear in both feeds by default?
- Which seed agency accounts should be verified for the demo?

## Definition of done

Runs under `pnpm dev`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass, migrations apply cleanly on a fresh Neon branch, `.env.example` is current, and the feature works on a Vercel preview deployment.
