import { utc, type SeedListing, type SeedPost } from "./seed-types";

// More cost-of-living programs, mostly California. Sources are official pages for each program.
//
// Rules (see AGENTS.md "Data accuracy and safety rules"):
// - Every fact below came from an official page as shown in a search result on 2026-11-07.
//   None of these pages was read in full, so `sourceCheckedAt` is null for all of them and the
//   card says "Check the source for the latest details".
// - Where sources disagreed or looked old, the text says so instead of picking a number.
// - A closed listing needs a real date from the source.
//
// Left out on purpose:
// - Bank On California: the state's own report says the program has "largely gone dormant".
// - California E-Bike Incentive Project: the page says applications are closed but gives no date.
// - Prop 103 auto discounts: no source was confirmed.

export const EXTRA_LISTINGS: SeedListing[] = [
  // ------------------------------------------------------------ Utilities and phone
  {
    slug: "care-california-alternate-rates-for-energy",
    name: "CARE (California Alternate Rates for Energy)",
    type: "benefit",
    category: "utilities",
    level: "state",
    state: "CA",
    summary:
      "A monthly discount on your electric and gas bills for income-qualified households. Large utilities give about 30% to 35% off electricity and 20% off natural gas. The program is paid for by a small charge on all other customers' bills.",
    // TODO(verify): the CPUC income table changes every June. Confirm the current limits.
    eligibility:
      "Based on household income and size. The CPUC's table for June 2026 to May 2027 lists $43,280 for a household of one or two, plus $11,360 for each extra person. Other pages still show older tables, so check the current one. Apply through your utility.",
    url: "https://www.cpuc.ca.gov/industries-and-topics/electrical-energy/electric-costs/care-fera-program",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "monthly",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "fera-family-electric-rate-assistance",
    name: "FERA (Family Electric Rate Assistance)",
    type: "benefit",
    category: "utilities",
    level: "state",
    state: "CA",
    summary:
      "An 18% monthly discount on your electric bill for households whose income is a little too high for CARE. It is offered by Southern California Edison, San Diego Gas & Electric and Pacific Gas & Electric. You can use the same form as CARE.",
    // Gemini's list said households of three or more. That rule was removed by SB 1130 (2024).
    eligibility:
      "Households of any size can qualify if their income is above the CARE limit and within the FERA limit. Older pages still say you need three or more people. That rule was removed in 2024. Check the CPUC's current income table.",
    url: "https://www.cpuc.ca.gov/industries-and-topics/electrical-energy/electric-costs/care-fera-program",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "monthly",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "energy-savings-assistance-program",
    name: "Energy Savings Assistance (free weatherization and appliances)",
    type: "benefit",
    category: "utilities",
    level: "state",
    state: "CA",
    summary:
      "Free home energy upgrades through your utility, such as attic insulation, weatherstripping, caulking, and energy-efficient refrigerators and furnaces. Homeowners and renters can both qualify. People who enroll and verify income are also signed up for CARE.",
    // TODO(verify): the CPUC page shows 2023-2024 dollar limits, so only the percentage is stated here.
    eligibility:
      "Household income at or below 250% of the federal poverty guidelines. Apartment buildings have separate rules. Contact your utility to apply.",
    url: "https://www.cpuc.ca.gov/consumer-support/financial-assistance-savings-and-discounts/energy-savings-assistance",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "one_time",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "medical-baseline-allowance",
    name: "Medical Baseline Allowance",
    type: "benefit",
    category: "utilities",
    level: "state",
    state: "CA",
    summary:
      "Extra gas and electricity each month, billed at your utility's lowest rate, for households that need power for medical reasons. It is based on medical need, not income.",
    eligibility:
      "A household member who relies on life support equipment, has a qualifying condition, or uses certain mechanical or mobility equipment. A doctor must sign the application. Therapy devices generally do not qualify. Apply through your utility.",
    url: "https://www.cpuc.ca.gov/consumer-support/financial-assistance-savings-and-discounts/medical-baseline",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "monthly",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "california-lifeline",
    name: "California LifeLine (discounted phone service)",
    type: "benefit",
    category: "utilities",
    level: "state",
    state: "CA",
    summary:
      "A discount on home or cell phone service. The monthly discount is up to $19. The federal Lifeline program can add up to $9.25 a month, and the two can be combined. You get one discounted service per household.",
    // TODO(verify): income limits change each June, and CPUC pages show different years.
    eligibility:
      "Based on income, or on being enrolled in a program such as Medi-Cal, SSI, CalFresh, LIHEAP, Section 8 or WIC. The discount applies to your primary home only. Apply through a participating phone company. You renew once a year.",
    url: "https://www.cpuc.ca.gov/consumer-support/financial-assistance-savings-and-discounts/lifeline",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 1_900,
    frequency: "monthly",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    // TODO(verify): the CPUC required AMP "through October 2026". It is now past that, and a search
    // did not confirm whether it was extended. Confirm with your utility before relying on it.
    slug: "arrearage-management-plan",
    name: "Arrearage Management Plan (past-due bill forgiveness)",
    type: "benefit",
    category: "utilities",
    level: "state",
    state: "CA",
    summary:
      "For CARE or FERA customers who are far behind on gas or electric bills. Each on-time monthly payment erases part of your old balance. After 12 on-time payments, the rest is forgiven, up to $8,000. Offered by SCE, PG&E and SDG&E. The CPUC required it through October 2026, so ask your utility if it continues.",
    eligibility:
      "A CARE or FERA customer with at least $500 past due ($250 for gas only) and a bill more than 90 days late. PG&E also asks that you have been a customer for six months. You can be removed if you miss payments, but you keep the forgiveness you already earned.",
    url: "https://www.sce.com/save-money/income-qualified-programs/arrearage-management-plans",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 800_000,
    frequency: "one_time",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "liheap-weatherization-california",
    name: "LIHEAP Weatherization (free energy upgrades, CSD)",
    type: "benefit",
    category: "utilities",
    level: "state",
    state: "CA",
    summary:
      "Free energy efficiency upgrades for low-income households, paid for through California's LIHEAP funding. You also get energy education and budget counseling. Local community action agencies and nonprofits do the work.",
    // TODO(verify): the income rule is from a draft state plan. Confirm it in the final plan.
    eligibility:
      "A draft state plan lists an income limit of 60% of state median income. Households with a high energy cost burden, older adults, people with disabilities and families with young children get priority. Find a local provider on the CSD website.",
    url: "https://www.csd.ca.gov/pages/liheapprogram.aspx",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "one_time",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },

  // ------------------------------------------------------------ Solar and home energy
  {
    // TODO(verify): the CPUC said the ratepayer budgets (including Equity Resiliency) stopped taking
    // new applications after Dec 30, 2025, and that the AB 209 budgets stayed open. Confirm which
    // budget applies to you before planning around this.
    slug: "self-generation-incentive-program",
    name: "Self-Generation Incentive Program (home batteries)",
    type: "grant",
    category: "utilities",
    level: "state",
    state: "CA",
    summary:
      "Rebates toward a home battery. The equity budgets paid $850 per kWh of storage, and the Equity Resiliency budget paid $1,000 per kWh. The ratepayer budgets, including Equity Resiliency, stopped taking new applications at the end of 2025. The AB 209 budgets stayed open.",
    eligibility:
      "Equity Resiliency was for homes in high fire-threat areas that had two or more power shutoffs, or for households with a medical need. Check the program page for which budgets are open now.",
    url: "https://www.cpuc.ca.gov/industries-and-topics/electrical-energy/demand-side-management/self-generation-incentive-program/participating-in-self-generation-incentive-program-sgip",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "one_time",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    // Closed: the credit is not allowed for spending made after Dec 31, 2025.
    // TODO(verify): the 30% rate is from IRS materials read through a search result.
    slug: "residential-clean-energy-credit-25d",
    name: "Residential Clean Energy Credit (Section 25D)",
    type: "tax_credit",
    category: "utilities",
    level: "federal",
    state: null,
    summary:
      "A federal tax credit of 30% of the cost of home solar, batteries and similar systems. It ended for spending after December 31, 2025. A system counts when its installation is finished, so paying in 2025 for a system finished in 2026 does not qualify. You can still carry unused credit forward on Form 5695.",
    eligibility:
      "Homeowners who finished installing a qualifying system by December 31, 2025. Ask a tax professional about your installation date.",
    url: "https://www.irs.gov/credits-deductions/residential-clean-energy-credit",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "one_time",
    opensAt: null,
    closesAt: utc("2025-12-31"),
    sourceCheckedAt: null,
  },
  {
    // Closed: single-family reservations were fully reserved as of Feb 24, 2026.
    slug: "heehra-heat-pump-rebates-tech-clean-california",
    name: "HEEHRA heat pump rebates (TECH Clean California)",
    type: "grant",
    category: "utilities",
    level: "state",
    state: "CA",
    summary:
      "Rebates for a heat pump that replaces your main heating system: up to $8,000 for households below 80% of area median income, and up to $4,000 between 80% and 150%. Single-family rebates were fully reserved as of February 24, 2026, and multifamily rebates as of September 1, 2026. Ask a contractor or TECH Clean California whether funds have reopened.",
    eligibility:
      "Homeowners in a single-family home with income below 150% of area median income. You must use a TECH-certified contractor with the HEEHRA badge, and you must get an approved reservation before the work starts.",
    url: "https://techcleanca.com/incentives/heehrarebates/",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 800_000,
    frequency: "one_time",
    opensAt: null,
    closesAt: utc("2026-02-24"),
    sourceCheckedAt: null,
  },
  {
    // The last registration window found ran Aug 20 to Oct 17, 2025 (extended from Oct 1).
    // TODO(verify): confirm the 2026 dates and the current supplemental income limit.
    slug: "earthquake-brace-and-bolt",
    name: "Earthquake Brace + Bolt",
    type: "grant",
    category: "housing",
    level: "state",
    state: "CA",
    summary:
      "A grant of up to $3,000 toward bracing and bolting an older house to its foundation. Some households can get a supplemental grant on top, up to $7,000 in the 2025 round. Registration opens in windows, and the latest one we found closed on October 17, 2025.",
    eligibility:
      "Wood-frame houses built before 1980 with a raised foundation, in participating ZIP codes. The 2025 round also opened to rentals. The supplemental grant has an income limit, and the limit changes each year.",
    url: "https://www.earthquakebracebolt.com/",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 300_000,
    frequency: "one_time",
    opensAt: null,
    closesAt: utc("2025-10-17"),
    sourceCheckedAt: null,
  },
  {
    slug: "turf-replacement-rebate-socal-watersmart",
    name: "Turf Replacement Rebate (SoCal Water$mart)",
    type: "grant",
    category: "utilities",
    level: "county",
    state: "CA",
    summary:
      "A rebate for replacing a lawn with water-wise landscaping. The program FAQ lists $2 per square foot, up to 5,000 square feet. An older fact sheet lists $3, so check the current rate. You must reserve funds before you start, and synthetic turf does not count.",
    // TODO(verify): sources disagree on the rate. The maximum is figured from $2 x 5,000 sq ft.
    eligibility:
      "Homeowners in Metropolitan Water District service areas in Southern California. Reserve first, then finish within 180 days. If you already removed the lawn, you will be denied. Your local water agency may add its own rebate.",
    url: "https://socalwatersmart.com/en/residential/rebates/available-rebates/turf-replacement-program/",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 1_000_000,
    frequency: "one_time",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },

  // ------------------------------------------------------------ Transportation and insurance
  {
    slug: "california-low-cost-auto-insurance",
    name: "California Low Cost Auto Insurance",
    type: "other",
    category: "insurance",
    level: "state",
    state: "CA",
    summary:
      "State-backed liability car insurance for income-eligible good drivers. The site lists yearly premiums from $199 to $986 depending on your county. The policy covers liability only, with no collision or comprehensive coverage.",
    // TODO(verify): the 2026 CDI report lists income limits of $39,900 for one person and $54,100 for two.
    eligibility:
      "A valid California license, age 16 or older with a good driving record, a car worth $25,000 or less, and income under the limit for your household size. Apply at the website, by phone at 866-602-8861, or through an agent.",
    url: "https://www.mylowcostauto.com/",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "bar-consumer-assistance-program",
    name: "Consumer Assistance Program (smog repair and car retirement)",
    type: "grant",
    category: "transportation",
    level: "state",
    state: "CA",
    summary:
      "Money from the Bureau of Automotive Repair. Income-eligible owners can get up to $1,450 for emissions repairs when a car fails Smog Check, or up to $2,000 to retire the car. People who are not income eligible can get $1,350 to retire a vehicle.",
    // TODO(verify): the amounts are the ones effective Jan 1, 2025. Older sources show lower figures.
    eligibility:
      "For the higher amounts, gross household income at or below 225% of the federal poverty level. Repairs must be done at a STAR-certified station, and retirement at an authorized dismantler.",
    url: "https://www.bar.ca.gov/consumer/consumer-assistance-program",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 200_000,
    frequency: "one_time",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "clean-cars-4-all",
    name: "Clean Cars 4 All",
    type: "grant",
    category: "transportation",
    level: "state",
    state: "CA",
    summary:
      "A grant for retiring an older car and buying a newer plug-in hybrid or electric one. The listed amounts are $9,500 or $10,000, and $11,500 or $12,000 in disadvantaged communities, with up to $2,000 more for charging equipment. You apply through your regional air district.",
    // TODO(verify): a CARB fact sheet states a different maximum, so confirm the amounts with your district.
    eligibility:
      "Household income at or below 300% of the federal poverty level, in a participating air district.",
    url: "https://ww2.arb.ca.gov/our-work/programs/clean-cars-4-all/about",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 1_200_000,
    frequency: "one_time",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "myfirstev",
    name: "MyFirstEV",
    type: "grant",
    category: "transportation",
    level: "state",
    state: "CA",
    summary:
      "A rebate at the point of sale for first-time buyers of a zero-emission vehicle: up to $3,500 for a new one and up to $1,750 for a used one. It can be combined with Clean Cars 4 All. Funds go to the first people to ask, until the money runs out.",
    eligibility:
      "First-time zero-emission vehicle buyers. Cars must be model year 2026 or newer, and used cars must be certified pre-owned from a manufacturer.",
    url: "https://www.caclimateinvestments.ca.gov/myfirstev",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 350_000,
    frequency: "one_time",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    // TODO(verify): the income limits shown on these pages are from different years.
    slug: "clipper-start",
    name: "Clipper START (Bay Area transit discount)",
    type: "other",
    category: "transportation",
    level: "county",
    state: "CA",
    summary:
      "A 50% discount on single rides on Bay Area transit systems that take Clipper. It is not a pass. It is now a permanent program.",
    eligibility:
      "Adults aged 19 to 64 with household income under the limit for their household size. People who get CalFresh qualify automatically. Check the program site for the current income table.",
    url: "https://www.clipperstartcard.com/s/",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "la-metro-life-program",
    name: "LA Metro LIFE Program",
    type: "other",
    category: "transportation",
    level: "county",
    state: "CA",
    summary:
      "Free or discounted transit for low-income riders in Los Angeles County. New enrollees get 90 days of free rides on Metro and 16 other agencies. After that, you get 20 free rides each month, or a discounted pass on other agencies.",
    eligibility:
      "You can qualify with an EBT card, Medi-Cal or SSI, or by income. South LA and Pomona ZIP codes can get 6 more free months. Check the program page for the current income table.",
    url: "https://www.metro.net/fares/life/",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "safer-from-wildfires-insurance-discounts",
    name: "Safer from Wildfires insurance discounts",
    type: "other",
    category: "insurance",
    level: "state",
    state: "CA",
    summary:
      "Insurers must give discounts on home insurance when you take steps to protect your home from wildfire, such as clearing defensible space or upgrading vents. A March 2026 state briefing lists discounts of 4% to 40%, with the biggest for the highest-risk homes. Insurers can differ by action, so compare.",
    eligibility:
      "Homeowners who finish wildfire mitigation work. Tell your insurance company or agent about the work. They may need an inspection or proof. You can also ask for your home's wildfire risk score.",
    url: "https://www.insurance.ca.gov/01-consumers/105-type/95-guides/03-res/Insurers-Currently-Offering-Discounts.cfm",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },

  // ------------------------------------------------------------ Housing and property tax
  {
    slug: "calhfa-myhome-assistance",
    name: "CalHFA MyHome Assistance Program",
    type: "loan",
    category: "housing",
    level: "state",
    state: "CA",
    summary:
      "A deferred-payment second loan for a down payment or closing costs. It covers up to 3.5% of the price or appraised value (the lesser) with an FHA first loan, or up to 3% with a conventional first loan. You pay it back when you sell, refinance or transfer the home.",
    eligibility:
      "Homebuyers who use a CalHFA first mortgage, meet CalHFA income limits, and buy a primary residence. You cannot take cash back from the loan. Talk to a CalHFA-approved lender.",
    url: "https://www.calhfa.ca.gov/homebuyer/programs/myhome.htm",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    // Applications open Oct 1, 2026. The filing deadline is Feb 10, 2027.
    // TODO(verify): the 2026-27 income cap of $57,002 comes from a State Controller press release.
    slug: "property-tax-postponement",
    name: "Property Tax Postponement",
    type: "other",
    category: "housing",
    level: "state",
    state: "CA",
    summary:
      "Lets eligible homeowners put off paying the current year's property taxes. The postponed taxes carry 5% interest a year and are secured by a lien on the home. You pay them back when you sell, transfer the title, refinance, or the owner dies. You must reapply every year, and funding is first come, first served.",
    eligibility:
      "You are 62 or older, or blind or disabled, and own and live in the home. Household income is $57,002 or less for the 2026-27 cycle. You have at least 40% equity and no reverse mortgage. The deadline for 2026-27 is February 10, 2027.",
    url: "https://www.sco.ca.gov/ardtax_prop_tax_postponement.html",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: utc("2026-10-01"),
    closesAt: utc("2027-02-10"),
    sourceCheckedAt: null,
  },
  {
    slug: "homeowners-exemption",
    name: "Homeowners' Exemption (property tax)",
    type: "benefit",
    category: "housing",
    level: "state",
    state: "CA",
    summary:
      "Takes $7,000 off the taxable value of your main home. At a 1% tax rate that saves about $70 a year, and a bit more where voters approved local bonds. You file once, and you keep getting it while you own and live in the home.",
    eligibility:
      "Owners whose main home is their residence on January 1. It does not apply to rentals, vacant homes or second homes. File form BOE-266 with your county assessor by February 15 to get the full amount for that year.",
    url: "https://www.boe.ca.gov/proptaxes/homeowners_exemption.htm",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: "yearly",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },

  // ------------------------------------------------------------ Money, health, family
  {
    // TODO(verify): the $1,189 maximum is for tax year 2025. It is indexed every year.
    slug: "young-child-tax-credit",
    name: "California Young Child Tax Credit (YCTC)",
    type: "tax_credit",
    category: "income",
    level: "state",
    state: "CA",
    summary:
      "A California tax credit for families with a child under 6. For tax year 2025 it can be worth up to $1,189. You claim it by filing a state return, and it can come back as cash or reduce what you owe.",
    eligibility:
      "You must also qualify for the CalEITC and have a child under 6 at the end of the tax year. The usual earned-income limit is $32,900. People with zero earned income may qualify under special rules.",
    url: "https://www.ftb.ca.gov/file/personal/credits/young-child-tax-credit.html",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 118_900,
    frequency: "yearly",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "hospital-charity-care-ab-1020",
    name: "Hospital charity care and discounted bills (AB 1020)",
    type: "other",
    category: "health",
    level: "state",
    state: "CA",
    summary:
      "California hospitals must let uninsured patients, and patients with high medical costs, apply for free or discounted care if their income is at or below 400% of the federal poverty level. A full write-off is possible. Hospitals cannot make you sign up for Medi-Cal first, and each hospital must post its policy online.",
    eligibility:
      "Uninsured or high-cost patients at or below 400% of the federal poverty level. Rural hospitals may set a lower limit. Individual hospital policies vary. Complaints go to HCAI's Hospital Bill Complaint Program.",
    url: "https://hcai.ca.gov/affordability/hospital-fair-billing-program/laws-and-regulations/",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    // TODO(verify): the details found are for plan year 2025. Check the 2026 and 2027 plan years.
    slug: "covered-california-cost-sharing-reductions",
    name: "Covered California cost-sharing reductions",
    type: "other",
    category: "health",
    level: "state",
    state: "CA",
    summary:
      "Help beyond lower monthly premiums. If you pick a Silver plan, lower deductibles and copays are built in. In the 2024 and 2025 plan years the state added to the federal help and removed deductibles from the three Silver CSR plans.",
    eligibility:
      "Based on household income, as a share of the federal poverty level. Federal rules covered up to 250%. The state's 2025 changes widened who can get an enhanced Silver 73 plan. Check the current plan year on the Covered California site.",
    url: "https://www.coveredca.com/support/before-you-buy/what-is-financial-help/",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    // TODO(verify): sources disagree on the newborn deposit ($100 in the 2026 guide, $175 in a 2024 deck).
    slug: "calkids",
    name: "CalKIDS (college savings account)",
    type: "grant",
    category: "education",
    level: "state",
    state: "CA",
    summary:
      "A free college savings account from the state. Children born in California on or after July 1, 2023 get a $100 deposit, with a $25 bonus for claiming it online. Eligible public school students in grades 1 to 12 get $500, and up to $1,500 if they are also foster youth or homeless.",
    eligibility:
      "Newborns qualify regardless of income. Students qualify based on the Local Control Funding Formula and enrollment on Census Day, and are signed up automatically.",
    url: "https://calkids.org/",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: 150_000,
    frequency: "one_time",
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "child-care-subsidies-calworks-capp",
    name: "Child care subsidies (CalWORKs and Alternative Payment)",
    type: "other",
    category: "childcare",
    level: "state",
    state: "CA",
    summary:
      "Help paying for child care while you work or go to school. CalWORKs child care is for families on or recently off cash aid. The Alternative Payment Program is a voucher for working families who are not on CalWORKs. You may owe a small family fee based on your income.",
    // TODO(verify): the income limit is 85% of state median income, and the site refers to a yearly table.
    eligibility:
      "Income up to 85% of the state median income for your family size, and a need for care such as work, school or job training. Apply through your county or a local child care resource and referral agency.",
    url: "https://mychildcareplan.org/resource/child-care-subsidies/",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
  {
    slug: "california-state-library-parks-pass",
    name: "California State Library Parks Pass",
    type: "other",
    category: "other",
    level: "state",
    state: "CA",
    summary:
      "A free day-use pass for state parks that you check out from a public library, like a book. It covers one car (nine or fewer seats) or one motorcycle at over 200 state park units. The separate Golden Bear Pass is free for people who get CalWORKs or SSI, and for income-eligible Californians over 62.",
    eligibility:
      "Anyone can borrow a library pass. Each library sets its own checkout period, and passes are not honored at parks run by local or federal agencies. The Golden Bear Pass has its own eligibility rules.",
    url: "https://www.parks.ca.gov/30806",
    targetAudience: "household",
    amountMinCents: null,
    amountMaxCents: null,
    frequency: null,
    opensAt: null,
    closesAt: null,
    sourceCheckedAt: null,
  },
];

// Posts about offers that are not run by a government agency, plus a few posts that share the
// listings above. Posts are community voices, so they carry no amounts. Every post has a source
// link, and the card says "Community post, verify at source".
export const EXTRA_POSTS: SeedPost[] = [
  {
    author: "demo-household",
    body: "Demo post: if you get CalFresh or another benefit, some phone and internet companies have low-cost plans. AT&T calls theirs Access. Check the plan page for who qualifies and what it costs now.",
    sourceUrl: "https://www.att.com/internet/access/",
    states: [],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: Spectrum has a plan called Internet Assist for people who qualify. The company decides who qualifies, so read the rules on their page first.",
    sourceUrl: "https://www.spectrum.com/internet/spectrum-internet-assist",
    states: [],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: EveryoneOn is a nonprofit that helps people find low-cost internet plans and devices in their area. It is not a government site, so check each offer before you sign up.",
    sourceUrl: "https://www.everyoneon.org/",
    states: [],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: Museums for All is a program where museums offer reduced admission to people who show an EBT card. Check your local museum's page for its exact rules.",
    sourceUrl: "https://www.museums4all.org/",
    states: [],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: Amazon has a discounted Prime membership for people who get certain government benefits. It is a company offer, not a government one, so the rules can change.",
    sourceUrl: "https://www.amazon.com/primeaccess",
    states: [],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: Market Match is a program where some farmers markets match what you spend with an EBT card. Ask at the market table to see if yours takes part.",
    sourceUrl: "https://marketmatch.org/",
    states: ["CA"],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: OhmConnect is a company that pays you to use less power at certain times. It is not a government program, so read what it asks for before you join.",
    sourceUrl: "https://www.ohmconnect.com/",
    states: ["CA"],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: Dollar For is a nonprofit that helps people apply for hospital financial assistance. Under California law, many hospitals must offer free or discounted care. See the listing for the rules.",
    sourceUrl: "https://dollarfor.org/",
    states: ["CA"],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: GRID Alternatives is a nonprofit that works on solar for low-income households. Ask what is open in your area, because programs and budgets change.",
    sourceUrl: "https://gridalternatives.org/",
    states: ["CA"],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: The Switch Is On has a tool to look up rebates for heat pumps and other electric appliances by ZIP code. Some rebate funds have run out, so check what is open.",
    sourceUrl: "https://www.switchison.org/",
    states: ["CA"],
    targetAudience: "household",
  },
  // Posts that share a listing show the listing's own card.
  {
    author: "demo-household",
    body: "Demo post: if your income is just over the CARE limit, look at FERA. It uses the same form.",
    listingSlug: "fera-family-electric-rate-assistance",
    states: ["CA"],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: California LifeLine and the federal Lifeline benefit can be combined. Ask your phone company how to sign up for both.",
    listingSlug: "california-lifeline",
    states: ["CA"],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: the property tax postponement deadline is in February. Gather your income papers early.",
    listingSlug: "property-tax-postponement",
    states: ["CA"],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: parents of young kids, the state's CalKIDS accounts are free. Check whether your child's account has been claimed.",
    listingSlug: "calkids",
    states: ["CA"],
    targetAudience: "household",
  },
  {
    author: "demo-household",
    body: "Demo post: hospital bill too high? California hospitals have to post a charity care policy. Read it before you pay.",
    listingSlug: "hospital-charity-care-ab-1020",
    states: ["CA"],
    targetAudience: "household",
  },
];
