# Plan: AGENTS.md + Next.js scaffold for the housing programs feed and listings

## Context

The repo is empty, with no commits on main.
The project is a "Lane 3: Fund it" app.
Affordable housing does not pencil because capped rents cannot repay construction costs, which leaves a funding gap.
Our angle is the household side.
We give people one place to discover government programs and subsidies, such as SNAP, Medi-Cal and LIHEAP.
Those programs cover other costs, which frees up household money for rent.
The product is a LinkedIn-style app where people post about government programs.
It also has a Listings tab, a simple database of the opportunities that exist.

### Decisions from the user

- Stack: Next.js full stack on Vercel.
- Database: Neon Postgres from the Vercel Marketplace, used with Drizzle ORM.
- Auth: Auth.js v5 with Google, with sessions stored in Postgres.
- Program data: a seeded catalog of programs, plus user posts.
- MVP scope: two tabs, Feed and Listings.
  Feed is a LinkedIn-style feed of posts.
  Each post has a body, a "potential benefits" dollar value, eligibility requirements, and state tags.
  Beyond those fields, the post format stays open, because it will be customized later.
  Listings is a simple, browsable database of potential opportunities, read from the seeded programs catalog.

## Step 1 - Write AGENTS.md (the first deliverable)

Create AGENTS.md at the repo root.
Follow the user's writing rules: each sentence on its own line, and no em dashes.

Sections:

- Project context - the pasted Lane 3 brief, kept faithful to the original: the problem, key terms (pencils, capital stack, LIHTC), why it is hard, and where the money can come from.
  Keep source tags (smartergrowth, berkeley, kmph) as inline citations.
- Our approach - give people access to every government program and subsidy, so they can offload other costs and put that money toward rent.
  Also, a LinkedIn-style feed where people post about programs, and a Listings tab where they can browse the opportunities.
- Architecture - Next.js App Router, TypeScript, Tailwind + shadcn/ui, Neon Postgres + Drizzle, Auth.js v5 (Google), and deployment on Vercel.
  Server Components read data.
  Server Actions handle mutations.
  There is no separate API server.
- Data model - a summary of the tables in Step 3.
- Conventions - pnpm, the folder layout, how migrations and seeds run, and env var names.
  Also: lint, typecheck and tests must pass before a commit.
  Commit messages never carry AI co-author trailers.
- Commands - dev, build, lint, typecheck, test, e2e, db:generate, db:migrate, db:seed.

Also add a one-line CLAUDE.md containing `@AGENTS.md`, so Claude Code sessions load it automatically.

## Step 2 - Scaffold the app

- Run `pnpm create next-app@latest .` with TypeScript, App Router, Tailwind, ESLint and the src/ dir.
- Add shadcn/ui for base components: button, card, textarea, avatar and dropdown.
- Add Prettier, a typecheck script, and a .env.example listing DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.

Layout:

```
src/
  app/
    layout.tsx            # nav bar with Feed / Listings tabs and sign-in / avatar
    page.tsx              # the feed
    posts/[id]/page.tsx   # post detail + comments
    listings/page.tsx     # the listings database
    api/auth/[...nextauth]/route.ts
  auth.ts                 # Auth.js config (Drizzle adapter, Google provider)
  db/
    index.ts              # drizzle(neon-http) client
    schema.ts
    seed.ts               # seeds the program catalog
  lib/actions/            # server actions: createPost, toggleLike, addComment, deletePost
  lib/states.ts           # US state codes and names (50 states + DC) for state tags
  components/feed/        # PostCard, Composer, LikeButton, CommentList
  components/listings/    # ListingCard
drizzle/                  # generated migrations
e2e/                      # Playwright tests
```

## Step 3 - Data model (Drizzle, src/db/schema.ts)

- Auth.js tables - users, accounts, sessions and verificationTokens, using the standard @auth/drizzle-adapter schema.
- programs - id, slug, name, level (federal, state or local), category (housing, food, health, energy, income or other), summary, url, state (nullable).
  Seeded with about 15 real programs: LIHTC, Section 8 vouchers, SNAP, WIC, Medi-Cal, LIHEAP, CalFresh, EITC/CalEITC, Lifeline/ACP successor, CA SB 4, and similar.
- posts - id, authorId, body, benefitCents (integer, nullable), benefitPeriod (enum: one_time, month or year, nullable), eligibility (text, nullable), states (text[] of two-letter state codes, default empty), programId (nullable FK), createdAt.
  benefitCents and benefitPeriod hold the "potential benefits" dollar value, such as $250 a month or $5,000 a year.
  The amount is stored in integer cents to avoid floating point errors, and is shown in whole dollars.
  benefitCents and benefitPeriod are either both set or both null, enforced with a check constraint.
  eligibility holds the requirements to qualify, such as income limits, household size or residency.
  An empty states array means the post is not tied to a state, for example a federal program.
  The rest of the format stays open so it can change later.
- comments - id, postId, authorId, body, createdAt.
- likes - (postId, userId) composite primary key.
- Indexes go on posts.createdAt for the feed and on comments.postId.

## Step 4 - Features

### Listings

- Listings page - a Server Component at /listings that lists every program in the catalog.
  Each listing shows name, level, category, summary, state if any, and a link to the official site.
- Listings are read-only for users and come from the seed, so there is no create or edit flow in the MVP.
- Signed out - listings are readable.

### Feed

- Feed page - a Server Component that lists posts newest first with cursor pagination ("Load more").
  Each post shows author avatar and name, relative time, body, a "Potential benefits" amount (for example "Up to $250/mo"), an "Eligibility" section, state tags, an optional program tag, like count, and comment count.
  The benefits amount and the eligibility section are hidden when empty.
- Composer - visible when signed in.
  It has a body textarea, a "Potential benefits" dollar input with a period select (one time, per month, per year), an "Eligibility requirements" textarea, a multi-select for state tags fed from lib/states.ts, and an optional "tag a program" select fed from the seeded catalog.
  It calls the createPost server action, which checks the session, validates with zod, and revalidates /.
  Validation: body 1 to 3000 chars, the benefit amount is a positive dollar value up to $1,000,000 and needs a period, eligibility is up to 2000 chars, and every state tag must be a known code with no duplicates.
- Likes - a toggleLike action with an optimistic UI using useOptimistic.
- Comments - on the post detail page, using an addComment action.
- Delete - authors can delete their own posts.
- Signed out - the feed is readable.
  Actions prompt sign-in.

## Step 5 - Vercel + Neon setup

- Install the Neon integration on the Vercel project.
  It injects DATABASE_URL and creates a database branch for each preview deployment.
- Local dev uses a personal Neon dev branch through .env.local.
- Migrations run with `drizzle-kit migrate` as part of the Vercel build, before `next build`.
- The Google OAuth client needs both the localhost and the Vercel callback URLs.
- Steps the user must do by hand, because they need accounts: create the Vercel project, attach Neon, and create the Google OAuth client.

## Verification

- `pnpm lint`, `pnpm typecheck` and `pnpm build` all pass with zero warnings.
- Vitest unit tests cover the zod validators, the benefit amount formatter, and the cursor pagination helper.
- Playwright E2E runs against `pnpm dev` and a test Neon branch.
  It covers: signed-out user sees the feed, signed-out user opens Listings and sees the seeded programs, sign in, create a post with potential benefits, eligibility requirements, a state tag and a program tag, check that all of them render on the card, like it, comment on it, delete it.
  Google OAuth cannot be automated, so a credentials provider is enabled only when E2E_TEST_AUTH=1 and never in production.
- Run the app manually and check the feed and listings UI closely at desktop and phone widths: spacing, alignment, empty state, and loading state.
- Deploy a Vercel preview and repeat the core flow there with real Google sign-in.
