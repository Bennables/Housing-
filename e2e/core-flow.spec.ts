import { expect, test } from "@playwright/test";
import { cleanupE2eData, signInAs, unique } from "./helpers";

test.afterAll(async () => {
  await cleanupE2eData();
});

test.describe("signed out", () => {
  test("reads the feed and is prompted to sign in for actions", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.getByRole("heading", { name: "Community feed" })).toBeVisible();
    await expect(page.getByRole("article").first()).toBeVisible();
    await expect(page.getByText("Sign in to share an opportunity")).toBeVisible();

    await page.getByRole("button", { name: "Like this post" }).first().click();
    await expect(page).toHaveURL(/\/signin\?next=/);
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  });

  test("browses the seeded listings, including past ones", async ({ page }) => {
    await page.goto("/listings");
    await expect(page.getByRole("heading", { name: "Listings" })).toBeVisible();
    await expect(page.getByRole("link", { name: "CalFresh (California's SNAP)" })).toBeVisible();
    await expect(page.getByText("Source: cdss.ca.gov").first()).toBeVisible();

    await page.getByLabel("Status").selectOption("closed");
    await page.getByRole("button", { name: "Apply filters" }).click();
    await expect(page.getByText("Affordable Connectivity Program (ACP)")).toBeVisible();
    await expect(page.getByText("Closed Jun 1, 2024")).toBeVisible();

    // Builders see their own side through the toggle.
    await page.goto("/listings?audience=builder");
    await expect(page.getByRole("link", { name: /Low-Income Housing Tax Credit/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "CalFresh (California's SNAP)" })).toHaveCount(0);
  });

  test("shows a listing page with its source and the disclaimer", async ({ page }) => {
    await page.goto("/listings/calfresh");
    await expect(page.getByRole("heading", { name: "CalFresh (California's SNAP)" })).toBeVisible();
    await expect(
      page
        .getByText("Information may change. Always confirm eligibility on the official site.")
        .first(),
    ).toBeVisible();
    await page.goto("/listings/does-not-exist");
    await expect(page.getByRole("heading", { name: "We could not find that page" })).toBeVisible();
  });

  test("needs sign-in for onboarding and hides the admin area", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/signin/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/signin/);
  });
});

test("a new user picks a role, shares a listing, likes, comments and deletes", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const name = unique("Household");
  await signInAs(context, { name });

  // Signed in but no role yet: sent to onboarding.
  await page.goto("/feed");
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByRole("button", { name: /^Household/ }).click();
  await expect(page).toHaveURL(/\/feed/);

  // Share an official listing. The post shows the embedded listing card.
  const body = unique("Share CalFresh");
  await page.getByLabel("What do you want to share?").fill(body);
  await page.getByPlaceholder("Search listings to share").click();
  await page.getByRole("option", { name: /CalFresh/ }).click();
  await page.getByLabel("State tags").selectOption("CA");
  await page.getByRole("button", { name: "Post", exact: true }).click();

  const post = page.getByRole("article", { name: `Post by ${name}` }).filter({ hasText: body });
  await expect(post).toBeVisible();
  await expect(post.getByText("Community post", { exact: true })).toBeVisible();
  await expect(
    post.getByRole("article", { name: "Listing: CalFresh (California's SNAP)" }),
  ).toBeVisible();
  await expect(post.getByText("California", { exact: true })).toBeVisible();

  // Like, optimistically.
  const like = post.getByRole("button", { name: "Like this post" });
  await like.click();
  await expect(post.getByRole("button", { name: "Unlike this post" })).toContainText("1");

  // Comment on the detail page.
  await post.getByRole("link", { name: /comments/ }).click();
  await expect(page).toHaveURL(/\/posts\//);
  const comment = unique("Thanks for sharing");
  await page.getByLabel("Add a comment").fill(comment);
  await page.getByRole("button", { name: "Comment", exact: true }).click();
  await expect(page.getByText(comment)).toBeVisible();

  // Delete the post.
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page).toHaveURL(/\/feed/);
  await expect(page.getByText(body)).toHaveCount(0);
  await context.close();
});

test("an unlisted opportunity shows its benefit, eligibility, state and source", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInAs(context, { name: unique("Neighbor"), role: "household" });

  const body = unique("New county help");
  await page.goto("/feed");
  await page.getByLabel("What do you want to share?").fill(body);
  await page
    .getByLabel("Source link (required if no listing is attached)")
    .fill("https://example.gov/help");
  await page.getByLabel("Potential benefits ($)").fill("250");
  await page.getByLabel("How often").selectOption("monthly");
  await page
    .getByLabel("Eligibility requirements")
    .fill("Renters in the county with a child under 5.");
  await page.getByLabel("State tags").selectOption("NV");
  await page.getByRole("button", { name: "Post", exact: true }).click();

  const post = page.getByRole("article").filter({ hasText: body });
  await expect(post.getByText("Up to $250/month")).toBeVisible();
  await expect(post.getByText("Renters in the county with a child under 5.")).toBeVisible();
  await expect(post.getByText("Nevada", { exact: true })).toBeVisible();
  await expect(post.getByText("Community post, verify at source")).toBeVisible();
  await expect(post.getByRole("link", { name: /Source: example.gov/ })).toBeVisible();

  // A post with neither a listing nor a source is rejected with a plain message.
  await page.getByLabel("What do you want to share?").fill(unique("No source"));
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Attach a listing or add a link" }),
  ).toBeVisible();
  await context.close();
});

test("a builder saves a listing and the capital stack shows the gap", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInAs(context, { name: unique("Builder"), role: "builder" });

  await page.goto("/listings?status=closed");
  const stack = page.getByRole("complementary", { name: "Your summary" });
  await expect(stack.getByRole("heading", { name: "My Capital Stack" })).toBeVisible();

  await stack.getByLabel("Project name").fill("Maple Court ADUs");
  await stack.getByLabel("Total development cost ($)").fill("100,000");
  await stack.getByLabel("First mortgage, if any ($)").fill("20,000");
  await stack.getByRole("button", { name: "Save project" }).click();
  await expect(stack.getByText("Maple Court ADUs")).toBeVisible();
  await expect(stack.getByText("Remaining gap")).toBeVisible();
  await expect(stack.locator("dd").filter({ hasText: "$80,000" })).toBeVisible();

  // Saving a one-time $40,000 grant closes part of the gap.
  const card = page.getByRole("article", { name: "Listing: CalHFA ADU Grant Program" });
  await card.getByRole("button", { name: "Save" }).click();
  await expect(card.getByRole("button", { name: "Saved" })).toBeVisible();
  await expect(stack.locator("dd").filter({ hasText: "$40,000" }).first()).toBeVisible();
  // The list is a plain block on desktop and a collapsed "Saved items" section on phones.
  const saved = stack.getByText("Saved items");
  if (await saved.isVisible()) await saved.click();
  await expect(stack.getByText("Counted toward the gap").filter({ visible: true })).toBeVisible();

  // Listings of other kinds never leak across: builders do not see household-only listings.
  await expect(page.getByText("Affordable Connectivity Program (ACP)")).toHaveCount(0);
  await context.close();
});

test("an agency is verified by an admin, then publishes a listing", async ({ browser }) => {
  const agencyContext = await browser.newContext();
  const agencyPage = await agencyContext.newPage();
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  const agencyName = unique("Test Housing Authority");
  await signInAs(agencyContext, { name: unique("Agency rep") });
  await signInAs(adminContext, { name: unique("Admin"), isAdmin: true, role: "household" });

  // Onboard as an agency.
  await agencyPage.goto("/onboarding");
  await agencyPage.getByRole("button", { name: /I represent an agency/ }).click();
  await agencyPage.getByLabel("Agency name").fill(agencyName);
  await agencyPage.getByLabel("What kind of agency is it?").selectOption("city");
  await agencyPage.getByLabel("Official website").fill("https://example.gov");
  await agencyPage.getByRole("button", { name: "Request verification" }).click();
  await expect(agencyPage).toHaveURL(/\/agency/);
  await expect(agencyPage.getByText("An admin is reviewing your agency.")).toBeVisible();
  await expect(agencyPage.getByRole("link", { name: "New listing" })).toHaveCount(0);

  // The admin verifies it.
  await adminPage.goto("/admin");
  const pending = adminPage.getByRole("listitem").filter({ hasText: agencyName });
  await expect(pending).toBeVisible();
  await pending.getByRole("button", { name: "Verify" }).click();
  await expect(adminPage.getByRole("listitem").filter({ hasText: agencyName })).toHaveCount(0);

  // The agency creates a listing, and it appears in Listings with the agency badge.
  await agencyPage.goto("/agency");
  await agencyPage.getByRole("link", { name: "New listing" }).click();
  const listingName = unique("Test Rent Relief");
  await agencyPage.getByLabel("Name", { exact: true }).fill(listingName);
  await agencyPage.getByLabel("Type", { exact: true }).selectOption("benefit");
  await agencyPage.getByLabel("Category").selectOption("rent");
  await agencyPage.getByLabel("Level").selectOption("city");
  await agencyPage.getByLabel("State", { exact: true }).selectOption("CA");
  await agencyPage.getByLabel("Who is it for?").selectOption("household");
  await agencyPage.getByLabel("Summary").fill("Helps renters cover part of the monthly rent.");
  await agencyPage.getByLabel("Official link").fill("https://example.gov/rent");
  await agencyPage.getByLabel("Highest ($)").fill("300");
  await agencyPage.getByLabel("How often paid").selectOption("monthly");
  await agencyPage.getByRole("button", { name: "Publish listing" }).click();
  await expect(agencyPage).toHaveURL(/\/agency$/);
  await expect(agencyPage.getByRole("link", { name: listingName })).toBeVisible();

  await agencyPage.goto(`/listings?q=${encodeURIComponent(listingName)}`);
  const card = agencyPage.getByRole("article", { name: `Listing: ${listingName}` });
  await expect(card).toBeVisible();
  await expect(card.getByText(agencyName)).toBeVisible();
  await expect(card.getByText("Verified agency")).toBeVisible();
  await expect(card.getByText("Up to $300/month")).toBeVisible();

  // Closing it moves it to past listings.
  await agencyPage.goto("/agency");
  agencyPage.once("dialog", (dialog) => dialog.accept());
  const row = agencyPage.getByRole("listitem").filter({ hasText: listingName });
  await row.getByRole("button", { name: "Close" }).click();
  // Wait for the action to finish and the page to refresh: the row then shows a "Closed" status.
  await expect(row.getByText("Closed", { exact: true })).toBeVisible();
  await agencyPage.goto(`/listings?status=closed&q=${encodeURIComponent(listingName)}`);
  await expect(agencyPage.getByRole("article", { name: `Listing: ${listingName}` })).toBeVisible();

  await agencyContext.close();
  await adminContext.close();
});

test("only admins can open the admin area", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInAs(context, { name: unique("Regular"), role: "household" });
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "We could not find that page" })).toBeVisible();
  await context.close();
});
