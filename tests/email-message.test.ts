import { describe, expect, it } from "vitest";
import {
  appUrl,
  confirmationEmail,
  escapeHtml,
  newListingEmail,
  oneLine,
} from "@/lib/email-message";
import { emailOptInSchema } from "@/lib/validation/notifications";

const BASE = "https://closing-the-gap.example";
const LISTING = {
  name: "CalFresh (California's SNAP)",
  summary: "Helps people with low income buy food each month.",
  slug: "calfresh",
};

describe("newListingEmail", () => {
  it("has the name in the subject and a link to the listing in both versions", () => {
    const mail = newListingEmail(LISTING, BASE);
    expect(mail.subject).toBe("New program for you: CalFresh (California's SNAP)");
    for (const body of [mail.text, mail.html]) {
      expect(body).toContain(`${BASE}/listings/calfresh`);
      expect(body).toContain("Always confirm eligibility on the official site.");
      expect(body).toContain(`${BASE}/profile#email-alerts`);
    }
  });

  it("escapes HTML in names and summaries", () => {
    const mail = newListingEmail(
      { name: `<script>alert("x")</script>`, summary: "Fish & chips <b>", slug: "x" },
      BASE,
    );
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain("Fish &amp; chips &lt;b&gt;");
  });

  it("keeps the subject on one line, even if the name has line breaks", () => {
    const mail = newListingEmail({ ...LISTING, name: "Rent\r\nBcc: evil@example.com" }, BASE);
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });

  it("shortens a long subject and a long summary", () => {
    const mail = newListingEmail(
      { name: "A".repeat(400), summary: "B".repeat(2000), slug: "long" },
      BASE,
    );
    expect(mail.subject.length).toBeLessThanOrEqual(150);
    expect(mail.text).not.toContain("B".repeat(300));
    expect(mail.text).toContain("...");
  });
});

describe("confirmationEmail", () => {
  it("tells people how to turn the alerts off", () => {
    const mail = confirmationEmail(BASE);
    expect(mail.text).toContain(`${BASE}/profile#email-alerts`);
    expect(mail.subject).toBe("Email alerts are on");
  });
});

describe("helpers", () => {
  it("escapeHtml handles all five characters", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("oneLine collapses whitespace", () => {
    expect(oneLine("  a \n\t b  ")).toBe("a b");
  });

  it("appUrl prefers APP_URL, then AUTH_URL, then the Vercel production domain", () => {
    expect(appUrl({ APP_URL: "https://a.example/", AUTH_URL: "https://b.example" })).toBe(
      "https://a.example",
    );
    expect(appUrl({ AUTH_URL: "https://b.example" })).toBe("https://b.example");
    expect(appUrl({ VERCEL_PROJECT_PRODUCTION_URL: "gap.vercel.app" })).toBe(
      "https://gap.vercel.app",
    );
    expect(appUrl({})).toBe("http://localhost:3000");
  });
});

describe("emailOptInSchema", () => {
  it("needs an explicit yes", () => {
    expect(emailOptInSchema.safeParse({ consent: true }).success).toBe(true);
    const no = emailOptInSchema.safeParse({ consent: false });
    expect(!no.success && no.error.issues[0].message).toMatch(/agree/);
    expect(emailOptInSchema.safeParse({}).success).toBe(false);
  });
});
