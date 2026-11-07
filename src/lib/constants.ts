// Plain value lists shared by the schema, validation and UI.
// They live outside src/db/schema.ts so client components can import them without pulling in Drizzle.

export const USER_ROLES = ["unassigned", "household", "builder", "agency"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const FREQUENCIES = ["one_time", "weekly", "monthly", "quarterly", "yearly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const AGENCY_LEVELS = ["federal", "state", "county", "city", "nonprofit"] as const;
export type AgencyLevel = (typeof AGENCY_LEVELS)[number];

export const LISTING_TYPES = [
  "grant",
  "benefit",
  "loan",
  "tax_credit",
  "zoning_bonus",
  "other",
] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_CATEGORIES = [
  "food",
  "health",
  "utilities",
  "rent",
  "childcare",
  "income",
  "development",
  "adu",
  "other",
] as const;
export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const LISTING_LEVELS = ["federal", "state", "county", "city"] as const;
export type ListingLevel = (typeof LISTING_LEVELS)[number];

export const AUDIENCES = ["builder", "household", "both"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const LISTING_STATUSES = ["open", "upcoming", "rolling", "closed"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const NOTIFICATION_TYPES = ["new_listing", "comment", "like"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Only these types are also sent as email. Likes and comments stay in the app. */
export const EMAIL_NOTIFICATION_TYPES: readonly NotificationType[] = ["new_listing"];

// none: no email for this notification. pending: waiting to send. sending: claimed by a sender.
export const EMAIL_STATUSES = ["none", "pending", "sending", "sent", "failed"] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export const REPORT_REASONS = [
  "Wrong or outdated information",
  "Scam or spam",
  "Asks for private information",
  "Rude or unsafe",
  "Other",
] as const;

export const LABELS = {
  frequency: {
    one_time: "One time",
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
  },
  listingType: {
    grant: "Grant",
    benefit: "Benefit",
    loan: "Loan",
    tax_credit: "Tax credit",
    zoning_bonus: "Zoning bonus",
    other: "Other",
  },
  category: {
    food: "Food",
    health: "Health",
    utilities: "Utilities",
    rent: "Rent",
    childcare: "Childcare",
    income: "Income",
    development: "Development",
    adu: "ADU",
    other: "Other",
  },
  level: {
    federal: "Federal",
    state: "State",
    county: "County",
    city: "City",
    nonprofit: "Nonprofit",
  },
  audience: { builder: "Builders", household: "Households", both: "Everyone" },
  status: { open: "Open", upcoming: "Upcoming", rolling: "Rolling", closed: "Closed" },
  role: {
    unassigned: "Not chosen yet",
    household: "Household",
    builder: "Builder",
    agency: "Agency",
  },
} as const;

export const DISCLAIMER =
  "Information may change. Always confirm eligibility on the official site.";
