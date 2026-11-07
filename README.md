# Closing the Gap

Affordable housing doesn't pencil.
Capped rents can't pay back what it costs to build, so every project has a funding gap.
Today someone assembles the money for that gap by hand, one project at a time.

This app tries to shrink the gap, or at least make the money that closes it easier to find.
It was built for Hack for Good, Lane 3: "Fund it: Does it pencil, and who closes the gap?"

## The idea

We come at the gap from both ends.

- **Households** get one place to find the programs that cover everyday costs (CalFresh, Medi-Cal, WIC, LIHEAP, EITC, Section 8, and more).
  The less a family spends on food, power and health care, the more they can put toward rent.
- **Builders** (developers, nonprofits, small ADU builders) get grants, loans, tax credits and zoning bonuses in one place.
  They can save the ones they care about into a capital stack and watch the gap shrink.

## Listings vs. posts

Don't mix these up.
The whole trust model depends on them staying separate.

|                | Listing                                        | Post                                 |
| -------------- | ---------------------------------------------- | ------------------------------------ |
| What it is     | The official opportunity                       | Someone talking about an opportunity |
| Who makes it   | Verified agencies, or an admin (seed listings) | Anyone signed in                     |
| Where it lives | Listings tab                                   | Feed tab                             |
| Trust          | "Verified agency" badge                        | "Community post, verify at source"   |

A post can share a listing, and then it shows that listing's card.
It never copies the amount or the eligibility.
There is one source of truth, and it's the listing.

If someone finds a grant that isn't listed yet, they post it with a source link.
An admin or the agency can then promote it to a real listing.

## What's in it

- **Feed and Listings**, readable without signing in.
- **Onboarding**: pick Builder, Household, or "I represent an agency".
  Agencies are unverified until an admin approves them, and unverified agencies can't publish.
- **Agency dashboard** (`/agency`): create, edit and close listings.
  Listings are never deleted, only closed.
- **Admin** (`/admin`): verify agencies, handle reports, turn community posts into listings.
- **My Capital Stack** for builders: project cost minus mortgage minus saved one-time funding equals the gap.
- **Household estimate**: recurring money turned into a monthly number, one-time money kept separate.
- **Alerts**: in-app, email (Amazon SES) and text (AWS SNS) when something new matches you.
  Text matching uses Claude to judge candidates.
  Both are off unless you set the keys.

## Rules the math follows

- Money is stored as integer cents.
- An amount always comes with a frequency, or both are null.
- We never add amounts with different frequencies together.
- Unknown amounts are shown but not counted.
- Totals say "potential funding".
  Saving a listing doesn't mean you'll get it.

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Drizzle on Neon Postgres, Auth.js v5 with Google sign-in, hosted on Vercel.
Pages read the database directly in Server Components.
Every write goes through a Server Action.
There is no separate API server.

## Getting it running

You need Node, pnpm, a Neon database, and a Google OAuth client.

```bash
pnpm install
cp .env.example .env.local   # then fill it in
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3000.

### Environment variables

The required ones:

| Variable                | What it is                                         |
| ----------------------- | -------------------------------------------------- |
| `DATABASE_URL`          | Neon pooled connection string                      |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string, used for migrations |
| `AUTH_SECRET`           | Generate with `openssl rand -base64 32`            |
| `AUTH_GOOGLE_ID`        | Google OAuth client ID                             |
| `AUTH_GOOGLE_SECRET`    | Google OAuth client secret                         |

Optional: `ADMIN_EMAILS` (comma-separated, those people become admins when they sign in), plus the AWS, SES, Anthropic and `APP_URL` keys for alerts.
Set `EMAIL_DRY_RUN=true` to log emails to the console instead of sending them.
`.env.example` has the full list with comments.

## Commands

```bash
pnpm dev           # dev server
pnpm build         # runs migrations, then next build
pnpm lint
pnpm typecheck
pnpm format        # prettier
pnpm test          # Vitest
pnpm e2e           # Playwright, desktop and phone
pnpm db:generate   # new migration from schema changes
pnpm db:migrate
pnpm db:seed
```

Lint, typecheck and tests should pass before you commit.

## Gotchas

- **The seed script runs on import.**
  Don't import `src/db/seed.ts` from another script, or it will seed whatever database your env points at.
  It upserts, so re-running it is safe, but it will overwrite edits to seeded rows.
- **E2E needs a throwaway database.**
  The tests create users and posts.
  Put a Neon test branch in `.env.test.local`, never your real one.
  Google sign-in can't be automated, so the tests insert a user and a session directly.
- **Never edit an applied migration.**
  Change the schema, then run `pnpm db:generate`.
- **Preview deployments should use Neon preview branches**, so they migrate their own copy and never touch production.

## About the data

This app deals with real benefits and people who are short on money, so we're strict about it.

- Every amount, date and eligibility rule in the seed data comes from an official page.
  If we couldn't confirm something, it's left empty and marked `TODO(verify)`.
- Some programs are closed or out of money.
  They stay in as past listings, marked closed.
- Listing and post pages carry a disclaimer: information may change, so confirm on the official site.
  The app gives no legal or financial advice.
- We collect as little personal data as we can.
  No SSNs, no bank details, no immigration status, no exact income.
- Copy is written at about an 8th-grade reading level.

Out of scope: payments, identity verification, submitting applications for people, DMs, native apps.

## For AI agents

Read [AGENTS.md](AGENTS.md) first.
It has the full data model and conventions.
