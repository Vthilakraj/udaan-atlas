import { test, expect } from "@playwright/test";
test("programme workflow: enroll, check in, schedule, report, and persist", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Your impact/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add learner", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name").fill("Kavya Test");
  await dialog.getByLabel("Email address").fill("kavya@example.test");
  await dialog.getByLabel("District", { exact: true }).fill("Pune");
  await dialog.getByLabel(/The learner has agreed/).check();
  await dialog.getByRole("button", { name: "Create outcome passport" }).click();
  await expect(dialog).toBeHidden();
  await page
    .getByRole("button", { name: "Learner passports", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search learners" })
    .fill("Kavya Test");
  await expect(
    page.getByRole("button", { name: /Open passport for Kavya Test/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Open passport for Kavya Test/ })
    .click();
  await page.getByRole("button", { name: "Record an update" }).click();
  await page.getByLabel("Current situation").selectOption("Employed");
  await page.getByLabel("Monthly income (₹)").fill("18000");
  await page.getByLabel("Role or livelihood").fill("Solar Technician");
  await page.getByLabel("Linked employer").selectOption("grid");
  await page.getByRole("button", { name: "Save this chapter" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByRole("table").getByText("Employed", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Learner passports", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search learners" })
    .fill("Kavya Test");
  await expect(page.getByRole("table").getByText("₹18,000")).toBeVisible();
});
test("employer verification is separate and a learner can update their own passport", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Demo role").selectOption("employer");
  await expect(
    page.getByRole("heading", { name: /Good stories/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "All records", exact: true }).click();
  await page.getByRole("button", { name: "Verify outcome" }).first().click();
  await page
    .getByLabel("Evidence note")
    .fill("Role and salary confirmed against our employer records.");
  await page
    .getByRole("button", { name: "Record employer verification" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByLabel("Demo role").selectOption("learner");
  await expect(
    page.getByRole("heading", { name: /Your skills/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Share an update" }).click();
  await page.getByLabel("Current situation").selectOption("Seeking work");
  await page
    .getByLabel("What would you like the team to know?")
    .fill("Looking for opportunities close to home.");
  await page.getByRole("button", { name: "Save this chapter" }).click();
  await expect(page.locator(".portal-status")).toContainText("Seeking work");
  await expect(page.locator(".portal-status")).toContainText("Self-reported");
});
test("desktop and phone layouts stay within the viewport; navigation works", async ({
  page,
}) => {
  for (const size of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/");
    await page.waitForTimeout(300);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (size.width < 800)
      await page.getByRole("button", { name: "Open navigation" }).click();
    await page
      .getByRole("button", { name: "Skill radar", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: /Small gaps/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
