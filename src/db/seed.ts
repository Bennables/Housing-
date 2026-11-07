import { config } from "dotenv";
import { inArray, sql } from "drizzle-orm";

config({ path: ".env.local" });
config();

// Seed rules (see AGENTS.md "Data accuracy and safety rules"):
// - Every amount, frequency, date and eligibility fact must come from the official URL.
// - If a fact could not be confirmed, leave it null and mark it TODO(verify).
// - `sourceCheckedAt` is only set when the official page itself was read on that date.
//   Facts read from search summaries of official pages leave it null, so the card says
//   "Check the source for the latest details".
// - Closed listings need a real date from the source. A program that is closed with no stated
//   date cannot be shown as closed, so it is left out (see the CalHome note at the bottom).

type SeedListing = {
  slug: string;
  name: string;
  type: "grant" | "benefit" | "loan" | "tax_credit" | "zoning_bonus" | "other";
  category:
    | "food"
    | "health"
    | "utilities"
    | "rent"
    | "childcare"
    | "income"
    | "development"
    | "adu"
    | "homebuying"
    | "other";
  level: "federal" | "state" | "county" | "city";
  state: string | null;
  summary: string;
  eligibility: string | null;
  url: string;
  targetAudience: "builder" | "household" | "both";
  amountMinCents: number | null;
  amountMaxCents: number | null;
  frequency: "one_time" | "weekly" | "monthly" | "quarterly" | "yearly" | null;
  opensAt: Date | null;
  closesAt: Date | null;
  sourceCheckedAt: string | null;
};

const CHECKED = "2026-11-07";
const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const SEED_LISTINGS: SeedListing[] = [
  // ---------------------------------------------------------------- Builder
  {
    slug: "low-income-housing-tax-credit",
    name: "Low-Income Housing Tax Credit (9% and 4%)",
    type: "tax_credit",
    category: "development",
    level: "federal",
    state: null,
    summary:
      "A federal tax credit for owners of low-income rental buildings. The credit is claimed each year over a 10-year period. A state or local housing credit agency allocates it. The 9% credit is for new buildings without other federal subsidy. The 4% credit is for new federally subsidized buildings and for existing buildings.",
    eligibility:
      "Owners of residential low-income rental buildings. Apply to your state or local housing credit agency.",
    url: "https://www.irs.gov/instructions/i8609",
    targetAudience: "builder",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: CHECKED,
  },
  {
    slug: "national-housing-trust-fund",
    name: "National Housing Trust Fund",
    // The page does not say whether this is a one-time or recurring grant to developers, so it is
    // typed "other" with no frequency instead of guessing. TODO(verify): amounts and frequency.
    type: "other",
    category: "development",
    level: "federal",
    state: null,
    summary:
      "Money from HUD for states to produce or preserve affordable housing for extremely low- and very low-income households. It can pay for buying, building, rebuilding or rehabilitating rental and owner housing. Builders apply to their state, not to HUD.",
    eligibility:
      "Funds go to states and state-designated entities. At least 80% must go to rental housing, and assisted units must stay affordable for at least 30 years. Ask your state's housing agency how to apply.",
    url: "https://www.hud.gov/hud-partners/community-affordable-housing-programs",
    targetAudience: "builder",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: CHECKED,
  },
  {
    slug: "california-state-density-bonus-law",
    name: "California State Density Bonus Law",
    type: "zoning_bonus",
    category: "development",
    level: "state",
    state: "CA",
    summary:
      "Gives developers who include affordable homes extra density above local zoning limits. It can also reduce parking requirements and provide cost-saving concessions and waivers of development standards.",
    // TODO(verify): thresholds are from HCD's April 2026 summary, read through a search result. Confirm in Gov. Code 65915.
    eligibility:
      "Projects of five or more units that set aside at least 5% of homes for very low-income households or 10% for lower-income households. Fully affordable projects get the largest bonus. Confirm the current rules in the statute.",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=GOV&sectionNum=65915",
    targetAudience: "builder",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    // Closed: the page says the latest round was fully allocated (update dated Dec 28, 2023).
    slug: "calhfa-adu-grant-program",
    name: "CalHFA ADU Grant Program",
    type: "grant",
    category: "adu",
    level: "state",
    state: "CA",
    summary:
      "Grants of up to $40,000 to repay pre-development and one-time closing costs for building an accessory dwelling unit (ADU). Pre-development costs include site prep, designs, permits, soil tests, impact fees, surveys and energy reports. The latest round of funding was fully allocated, and no new round is listed.",
    eligibility: "Income limits apply. See the program page for the current limits.",
    url: "https://www.calhfa.ca.gov/adu/",
    targetAudience: "builder",
    amountMinCents: null,
    amountMaxCents: 4_000_000,
    frequency: "one_time",
    opensAt: null,
    closesAt: utc("2023-12-28"),
    sourceCheckedAt: CHECKED,
  },
  {
    // Closed: the Trust's board voted on May 21, 2025 to discontinue the program.
    // TODO(verify): the page states no loan amount, interest rate or terms, so none are shown.
    slug: "orange-county-affordable-adu-loan-program",
    name: "Orange County Affordable ADU Loan Program",
    type: "loan",
    category: "adu",
    level: "county",
    state: "CA",
    summary:
      "A planned loan program from the Orange County Housing Finance Trust to help homeowners build an accessory dwelling unit (ADU). On May 21, 2025 the Trust's board voted to discontinue further efforts to establish it.",
    eligibility: null,
    url: "https://www.ochft.org/affordable-adu-loan-program",
    targetAudience: "builder",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: utc("2025-05-21"),
    sourceCheckedAt: CHECKED,
  },

  // -------------------------------------------------------------- Household
  {
    slug: "housing-choice-vouchers-section-8",
    name: "Housing Choice Vouchers (Section 8)",
    // TODO(verify): the page says the housing authority pays part of the rent to the landlord but
    // does not say how often. Monthly is how the payment works, but confirm at the source.
    type: "benefit",
    category: "rent",
    level: "federal",
    state: null,
    summary:
      "Helps low-income families, older adults, veterans and people with disabilities afford rental housing they find on the private market. A local housing authority pays part of the rent directly to the landlord. You usually pay about 30% of your adjusted monthly income.",
    eligibility:
      "Based on annual income and family size. Families generally must be extremely low-income or very low-income. You must be a U.S. citizen or an eligible non-citizen. Apply through your local public housing authority. Waiting lists can be long, so you may need to apply to several.",
    url: "https://www.hud.gov/helping-americans/housing-choice-vouchers-tenants",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "monthly",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: CHECKED,
  },
  {
    // CalFresh is California's name for SNAP, so it is seeded once.
    // TODO(verify): the state's sources give conflicting benefit amounts, so none is shown.
    slug: "calfresh",
    name: "CalFresh (California's SNAP)",
    type: "benefit",
    category: "food",
    level: "state",
    state: "CA",
    summary:
      "California's name for the federal SNAP program, once called food stamps. Benefits are loaded each month onto an EBT card that you can use to buy most foods.",
    eligibility:
      "Based on your income, expenses and household size. You do not need a job. You can apply online at BenefitsCal.com or through your county.",
    url: "https://www.cdss.ca.gov/inforesources/calfresh",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "monthly",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    // TODO(verify): the monthly frequency is how WIC food benefits are issued but was not read on the page.
    slug: "wic",
    name: "WIC (Women, Infants, and Children)",
    type: "benefit",
    category: "food",
    level: "federal",
    state: null,
    summary:
      "Nutrition help for pregnant, postpartum and breastfeeding women, infants, and children up to age 5. Apply at a WIC office in your area.",
    eligibility:
      "You must be in one of those groups, live in the state where you apply, and be found at nutritional risk by a health professional. Your gross income must be at or below 185% of the federal poverty guidelines, or you must get Medicaid, SNAP or TANF.",
    url: "https://www.fns.usda.gov/wic",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "monthly",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    // No frequency or amount: coverage is not a dollar amount, so this is typed "other".
    slug: "medi-cal",
    name: "Medi-Cal",
    type: "other",
    category: "health",
    level: "state",
    state: "CA",
    summary:
      "California's Medicaid program. It gives free or low-cost health coverage to people who qualify.",
    eligibility:
      "You must live in California and meet income and other rules. Most people are checked on income. Rules for older adults, people with disabilities and long-term care can include limits on assets. Your county office manages your case.",
    url: "https://www.dhcs.ca.gov/medi-cal/",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    // TODO(verify): yearly follows AGENTS.md's example, but help may be one time per season. The
    // official page blocked automated reading, so confirm the frequency and the state rules at the source.
    slug: "liheap",
    name: "LIHEAP (Home Energy Assistance)",
    type: "benefit",
    category: "utilities",
    level: "federal",
    state: null,
    summary:
      "Helps pay heating or cooling bills and offers emergency help during an energy crisis. It is run by states, territories and tribes, so the details depend on where you live.",
    eligibility:
      "Based on income, and each state or tribe sets its own limits. Households with older adults, people with disabilities or young children are a priority. There is no federal application. Contact your state or local LIHEAP office.",
    url: "https://acf.gov/ocs/programs/liheap",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "yearly",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    // The IRS page links to separate tables for amounts, so no amount is shown.
    slug: "earned-income-tax-credit",
    name: "Earned Income Tax Credit (EITC)",
    type: "tax_credit",
    category: "income",
    level: "federal",
    state: null,
    summary:
      "A federal tax credit for low- to moderate-income workers and families. It can reduce the taxes you owe and may increase your refund.",
    eligibility:
      "Based on earned income. The amount depends on your income, children or other dependents, disability and other rules. Military and clergy have special rules. Starting with tax year 2026 you must complete Schedule 3-A, Federal Public Benefit.",
    url: "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "yearly",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: CHECKED,
  },
  {
    // TODO(verify): figures are for tax year 2025, read through a search result of the FTB pages.
    // Update them each tax year.
    slug: "california-earned-income-tax-credit",
    name: "California Earned Income Tax Credit (CalEITC)",
    type: "tax_credit",
    category: "income",
    level: "state",
    state: "CA",
    summary:
      "A California tax credit for working people and families with low earned income. For tax year 2025 the maximum credit runs from $302 with no qualifying children to $3,756 with three or more.",
    eligibility:
      "For tax year 2025: you are 18 or older or have a qualifying child, you earned at least $1 and not more than $32,900, you lived in California more than half the year, and you have a valid SSN or ITIN. File a California return with Form FTB 3514.",
    url: "https://www.ftb.ca.gov/file/personal/credits/california-earned-income-tax-credit.html",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 375_600,
    frequency: "yearly",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    // Closed: the program ended on June 1, 2024 when funding ran out. Enrollment closed Feb 8, 2024.
    // TODO(verify): read through a search result of FCC pages, because fcc.gov blocks automated reading.
    slug: "affordable-connectivity-program",
    name: "Affordable Connectivity Program (ACP)",
    type: "benefit",
    category: "utilities",
    level: "federal",
    state: null,
    summary:
      "A discount of up to $30 a month on home internet, or up to $75 a month on qualifying Tribal lands. The program ended on June 1, 2024 when Congress did not provide more money.",
    eligibility: null,
    url: "https://www.fcc.gov/acp",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 3_000,
    frequency: "monthly",
    opensAt: null,
    closesAt: utc("2024-06-01"),
    sourceCheckedAt: null,
  },
  {
    // Closed: the page says the application period "is now CLOSED" and the portal closed March 16
    // (2026). Funds go out by random drawing, not first come, first served.
    // TODO(verify): the page also has a 05/20/2026 update that says "The next round of DFA vouchers
    // have been released", which conflicts with CLOSED. Confirm the status in the voucher portal.
    slug: "calhfa-dream-for-all",
    name: "CalHFA Dream For All Shared Appreciation Loan",
    type: "loan",
    category: "homebuying",
    level: "state",
    state: "CA",
    summary:
      "Down payment and closing cost help for first-generation homebuyers, used with the Dream For All conventional first mortgage. It covers up to 20% of the home price, not more than $150,000. It is a loan. When the home is sold, transferred or the first mortgage is paid off, you repay the loan plus a share of how much the home gained in value. The usual share is 20% of the gain, and it is lower for households at or below 80% of area median income. Funds go out by random drawing, not first come, first served.",
    eligibility:
      "One borrower must be a first-generation homebuyer and a current California resident. All borrowers must be first-time homebuyers. Household income must be within CalHFA income limits for the county where you buy. One borrower who will live in the home must finish an approved homebuyer education course.",
    url: "https://calhfa.ca.gov/dream/",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 15_000_000,
    frequency: "one_time",
    opensAt: utc("2026-02-24"),
    closesAt: utc("2026-03-16"),
    sourceCheckedAt: CHECKED,
  },
  {
    // The percentages come from CalHFA's loan programs page. The cap is a percent of the price, so
    // no dollar amount or frequency is set.
    // TODO(verify): eligibility comes from a search summary of the MyHome fact sheet. Income limits
    // are set by county on the fact sheet.
    slug: "calhfa-myhome-assistance",
    name: "CalHFA MyHome Assistance Program",
    type: "loan",
    category: "homebuying",
    level: "state",
    state: "CA",
    summary:
      "A deferred-payment loan for a down payment or closing costs. With an FHA loan it covers up to the lesser of 3.5% of the purchase price or appraised value. With a conventional loan it covers up to the lesser of 3%. You use it together with a CalHFA first mortgage, and it sits in second place behind that mortgage.",
    eligibility:
      "All borrowers must be first-time homebuyers and must live in the home. You must finish homebuyer education. Household income must be within the county limit. The money cannot pay off debt, and you cannot get cash back from the loan.",
    url: "https://www.calhfa.ca.gov/homebuyer/programs/myhome.htm",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
];

// Left out on purpose: HCD CalHome. Its page says "No longer accepting applications" but gives no
// date, and a closed listing needs a real date. Add it once the closing date is known.

const SEED_ADMIN_ID = "seed-admin";

const DEMO_USERS = [
  {
    id: "demo-household",
    name: "Demo household",
    email: "demo-household@demo.invalid",
    role: "household" as const,
  },
  {
    id: "demo-builder",
    name: "Demo builder",
    email: "demo-builder@demo.invalid",
    role: "builder" as const,
  },
  {
    id: "demo-agency-verified",
    name: "Demo agency (verified)",
    email: "demo-agency-verified@demo.invalid",
    role: "agency" as const,
  },
  {
    id: "demo-agency-pending",
    name: "Demo agency (pending)",
    email: "demo-agency-pending@demo.invalid",
    role: "agency" as const,
  },
];

async function main() {
  // Imported after dotenv has loaded, because the db client reads DATABASE_URL on import.
  const { db } = await import("./index");
  const { agencies, listings, posts, users } = await import("./schema");

  const demo = process.env.SEED_DEMO
    ? process.env.SEED_DEMO === "1"
    : process.env.NODE_ENV !== "production";

  // The account that owns admin-added listings. It never signs in.
  await db
    .insert(users)
    .values({
      id: SEED_ADMIN_ID,
      name: "Seed admin",
      email: "seed-admin@closing-the-gap.invalid",
      isAdmin: true,
    })
    .onConflictDoNothing();

  const listingRows = SEED_LISTINGS.map((l) => ({
    ...l,
    agencyId: null,
    createdById: SEED_ADMIN_ID,
  }));
  await db
    .insert(listings)
    .values(listingRows)
    .onConflictDoUpdate({
      target: listings.slug,
      set: {
        name: sql`excluded.name`,
        type: sql`excluded.type`,
        category: sql`excluded.category`,
        level: sql`excluded.level`,
        state: sql`excluded.state`,
        summary: sql`excluded.summary`,
        eligibility: sql`excluded.eligibility`,
        url: sql`excluded.url`,
        targetAudience: sql`excluded.target_audience`,
        amountMinCents: sql`excluded.amount_min_cents`,
        amountMaxCents: sql`excluded.amount_max_cents`,
        frequency: sql`excluded.frequency`,
        opensAt: sql`excluded.opens_at`,
        closesAt: sql`excluded.closes_at`,
        sourceCheckedAt: sql`excluded.source_checked_at`,
        updatedAt: sql`now()`,
      },
    });
  console.log(`Seeded ${SEED_LISTINGS.length} listings.`);

  if (!demo) {
    console.log("Skipped demo accounts and posts (production, or SEED_DEMO=0).");
    return;
  }

  await db
    .insert(users)
    .values(DEMO_USERS)
    .onConflictDoUpdate({
      target: users.id,
      set: { name: sql`excluded.name`, role: sql`excluded.role` },
    });

  // Two demo agencies: one verified, one waiting for review. They are clearly labeled demo data.
  await db
    .insert(agencies)
    .values([
      {
        userId: "demo-agency-verified",
        name: "Demo Housing Authority",
        level: "city",
        website: "https://example.com/demo-housing-authority",
        verified: true,
      },
      {
        userId: "demo-agency-pending",
        name: "Demo Community Land Trust",
        level: "nonprofit",
        website: "https://example.com/demo-community-land-trust",
        verified: false,
      },
    ])
    .onConflictDoUpdate({
      target: agencies.userId,
      set: {
        name: sql`excluded.name`,
        level: sql`excluded.level`,
        website: sql`excluded.website`,
        verified: sql`excluded.verified`,
      },
    });

  const bySlug = new Map(
    (
      await db
        .select({ id: listings.id, slug: listings.slug })
        .from(listings)
        .where(
          inArray(listings.slug, [
            "calfresh",
            "housing-choice-vouchers-section-8",
            "low-income-housing-tax-credit",
          ]),
        )
    ).map((r) => [r.slug, r.id]),
  );

  // Re-seeding replaces the demo posts instead of piling up copies.
  await db.delete(posts).where(
    inArray(
      posts.authorId,
      DEMO_USERS.map((u) => u.id),
    ),
  );

  const calfresh = bySlug.get("calfresh");
  const section8 = bySlug.get("housing-choice-vouchers-section-8");
  const lihtc = bySlug.get("low-income-housing-tax-credit");
  if (!calfresh || !section8 || !lihtc) throw new Error("Seed listings are missing.");

  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
  await db.insert(posts).values([
    {
      authorId: "demo-household",
      body: "Demo post: CalFresh applications can be started online. Gather your ID and your rent and utility bills first so it goes faster.",
      listingId: calfresh,
      states: ["CA"],
      targetAudience: "household",
      createdAt: minutesAgo(30),
    },
    {
      authorId: "demo-household",
      body: "Demo post: waiting lists for housing vouchers can be long, so it helps to ask your local housing authority how to join each list near you.",
      listingId: section8,
      states: [],
      targetAudience: "household",
      createdAt: minutesAgo(120),
    },
    {
      authorId: "demo-builder",
      body: "Demo post: if your project qualifies for the housing tax credit, talk to your state housing credit agency early about how credits are allocated.",
      listingId: lihtc,
      states: [],
      targetAudience: "builder",
      createdAt: minutesAgo(240),
    },
    {
      authorId: "demo-builder",
      body: "Demo post: found HCD's page that lists state housing funding programs. Worth a look if you build in California.",
      sourceUrl: "https://www.hcd.ca.gov/grants-and-funding",
      states: ["CA"],
      targetAudience: "builder",
      createdAt: minutesAgo(360),
    },
    {
      authorId: "demo-agency-verified",
      body: "Demo post from a demo agency: remember to bring proof of income and ID when you visit our office. This is example content, not a real agency.",
      sourceUrl: "https://example.com/demo-housing-authority",
      states: [],
      targetAudience: "both",
      createdAt: minutesAgo(480),
    },
  ]);
  console.log("Seeded demo accounts, 2 demo agencies and 5 demo posts.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
