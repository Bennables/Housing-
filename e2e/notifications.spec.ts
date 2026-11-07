import { expect, test, type Browser } from "@playwright/test";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import { emailSubscriptions, notifications } from "../src/db/schema";
import { cleanupE2eData, signInAs, unique } from "./helpers";

test.afterAll(async () => {
  await cleanupE2eData();
});

/** An admin publishes a listing for the given side, through the real form. */
async function adminPublishes(browser: Browser, audience: "household" | "builder", name: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInAs(context, { name: unique("Admin"), isAdmin: true, role: "household" });
  await page.goto("/admin/listings/new");
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Type", { exact: true }).selectOption("benefit");
  await page.getByLabel("Category").selectOption("rent");
  await page.getByLabel("Level").selectOption("city");
  await page.getByLabel("State", { exact: true }).selectOption("CA");
  await page.getByLabel("Who is it for?").selectOption(audience);
  await page.getByLabel("Summary").fill("Helps renters cover part of the monthly rent.");
  await page.getByLabel("Official link").fill("https://example.gov/rent");
  await page.getByLabel("Highest ($)").fill("300");
  await page.getByLabel("How often paid").selectOption("monthly");
  await page.getByRole("button", { name: "Publish listing" }).click();
  await expect(page).not.toHaveURL(/\/new/);
  await context.close();
}

test("a new listing notifies the right side, and reading it clears the badge", async ({
  browser,
}) => {
  const householdContext = await browser.newContext();
  const household = await householdContext.newPage();
  await signInAs(householdContext, { name: unique("Household"), role: "household" });
  const builderContext = await browser.newContext();
  const builder = await builderContext.newPage();
  await signInAs(builderContext, { name: unique("Builder"), role: "builder" });

  await household.goto("/feed");
  await expect(household.getByRole("link", { name: "Notifications", exact: true })).toBeVisible();

  const listingName = unique("Test Rent Help");
  await adminPublishes(browser, "household", listingName);

  // The household user sees an unread badge and the listing in their notifications.
  await household.goto("/feed");
  await expect(household.getByRole("link", { name: "Notifications, 1 unread" })).toBeVisible();
  await household.getByRole("link", { name: "Notifications, 1 unread" }).click();
  await expect(household).toHaveURL(/\/notifications/);
  const item = household.getByRole("link", {
    name: new RegExp(`New program for you: ${listingName}`),
  });
  await expect(item).toBeVisible();

  // A builder is not told about a household-only listing.
  await builder.goto("/notifications");
  await expect(builder.getByText("Nothing new yet")).toBeVisible();
  await expect(builder.getByRole("link", { name: "Notifications", exact: true })).toBeVisible();

  // Marking everything as read clears the badge.
  await household.getByRole("button", { name: "Mark all as read" }).click();
  await expect(household.getByRole("link", { name: "Notifications", exact: true })).toBeVisible();
  await expect(household.getByRole("button", { name: "Mark all as read" })).toHaveCount(0);

  // Opening the item goes to the listing.
  await item.click();
  await expect(household.getByRole("heading", { name: listingName })).toBeVisible();

  await householdContext.close();
  await builderContext.close();
});

test("likes and comments notify the post author, and never the person doing them", async ({
  browser,
}) => {
  const authorContext = await browser.newContext();
  const author = await authorContext.newPage();
  const authorName = unique("Author");
  await signInAs(authorContext, { name: authorName, role: "household" });
  const fanContext = await browser.newContext();
  const fan = await fanContext.newPage();
  const fanName = unique("Fan");
  await signInAs(fanContext, { name: fanName, role: "household" });

  const body = unique("Share CalFresh");
  await author.goto("/feed");
  await author.getByLabel("What do you want to share?").fill(body);
  await author.getByPlaceholder("Search listings to share").click();
  await author.getByRole("option", { name: /CalFresh/ }).click();
  await author.getByLabel("State tags").selectOption("CA");
  await author.getByRole("button", { name: "Post", exact: true }).click();
  await expect(
    author.getByRole("article", { name: `Post by ${authorName}` }).filter({ hasText: body }),
  ).toBeVisible();

  // Liking your own post does not notify you.
  await author
    .getByRole("article", { name: `Post by ${authorName}` })
    .filter({ hasText: body })
    .getByRole("button", { name: "Like this post" })
    .click();

  await fan.goto("/feed");
  const fanView = fan
    .getByRole("article", { name: `Post by ${authorName}` })
    .filter({ hasText: body });
  await fanView.getByRole("button", { name: "Like this post" }).click();
  await expect(fanView.getByRole("button", { name: /Unlike|Liked/ })).toBeVisible();

  // The like button updates before the server answers, so retry until the row is written.
  await expect(async () => {
    await author.goto("/notifications");
    await expect(author.getByText(`${fanName} liked your post`)).toBeVisible({ timeout: 1000 });
  }).toPass();
  await expect(author.getByText(`${authorName} liked your post`)).toHaveCount(0);

  // A comment from the fan adds a second notification.
  await fanView.getByRole("link", { name: /comments/ }).click();
  await expect(fan).toHaveURL(/\/posts\//);
  const comment = unique("Thanks for sharing");
  await fan.getByLabel("Add a comment").fill(comment);
  await fan.getByRole("button", { name: "Comment", exact: true }).click();
  await expect(fan.getByText(comment)).toBeVisible();
  await expect(async () => {
    await author.goto("/notifications");
    await expect(author.getByText(`${fanName} commented on your post`)).toBeVisible({
      timeout: 1000,
    });
  }).toPass();

  // The commenter is not told about their own comment.
  await fan.goto("/notifications");
  await expect(fan.getByText("Nothing new yet")).toBeVisible();

  await authorContext.close();
  await fanContext.close();
});

// Runs the whole email path with EMAIL_DRY_RUN=true, so nothing is sent to a real inbox:
//   EMAIL_DRY_RUN=true pnpm e2e e2e/notifications.spec.ts
test("email: opt in, get a queued email when a listing is published, opt out", async ({
  browser,
}) => {
  test.skip(process.env.EMAIL_DRY_RUN !== "true", "Needs EMAIL_DRY_RUN=true");

  const context = await browser.newContext();
  const page = await context.newPage();
  const { id: userId } = await signInAs(context, { name: unique("Emailer"), role: "household" });

  await page.goto("/profile");
  const turnOn = page.getByRole("button", { name: "Turn on emails" });
  await expect(turnOn).toBeDisabled();
  await page.getByLabel(/Email me when a new program/).check();
  await turnOn.click();
  await expect(page.getByText(/Email alerts are on/)).toContainText("@e2e.invalid");
  const saved = await db
    .select()
    .from(emailSubscriptions)
    .where(eq(emailSubscriptions.userId, userId));
  expect(saved).toHaveLength(1);

  const listingName = unique("Test Email Alert");
  await adminPublishes(browser, "household", listingName);

  // Email goes out after the response, so poll until it is marked sent.
  await expect
    .poll(
      async () => {
        const rows = await db
          .select({ status: notifications.emailStatus })
          .from(notifications)
          .where(and(eq(notifications.userId, userId), eq(notifications.type, "new_listing")));
        return rows.map((r) => r.status);
      },
      { timeout: 15_000 },
    )
    .toEqual(["sent"]);

  // Already on, so the notifications page does not ask again.
  await page.goto("/notifications");
  await expect(page.getByRole("link", { name: "Turn on email alerts" })).toHaveCount(0);

  await page.goto("/profile");
  await page.getByRole("button", { name: "Turn off emails" }).click();
  await expect(page.getByRole("button", { name: "Turn on emails" })).toBeVisible();
  const left = await db
    .select()
    .from(emailSubscriptions)
    .where(eq(emailSubscriptions.userId, userId));
  expect(left).toHaveLength(0);

  await context.close();
});
