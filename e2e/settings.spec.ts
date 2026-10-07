import type { Locator, Page } from "@playwright/test";

import { expect, openSheet, setSettings, test } from "./foundry.ts";

/** Open the system's settings app. Returns a locator for it. */
async function openSystemSettings(page: Page) {
  const id = await page.evaluate(async () => {
    const menu = game.settings.menus.get(
      "investigator.investigatorSettingsMenu",
    )!;
    const app = new menu.type() as foundry.applications.api.ApplicationV2;
    await app.render({ force: true });
    return app.id;
  });
  const app = page.locator(`[id="${id}"]`);
  await expect(app.getByText("Settings Home")).toBeVisible();
  return app;
}

/**
 * Mark the menu links in the settings page that's on top (pages slide in
 * over their parents, which stay underneath) with `data-e2e-link`, numbered
 * from 0. Returns how many there are.
 */
async function markMenuLinks(app: Locator) {
  // let any page finish sliding in
  await app.page().waitForTimeout(400);
  return app.evaluate((app) => {
    const links = Array.from(
      app.querySelectorAll<HTMLElement>(
        'nav:not([aria-label="Breadcrumbs"]) a',
      ),
    ).filter((link) => {
      link.removeAttribute("data-e2e-link");
      const rect = link.getBoundingClientRect();
      const top = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
      return top !== null && link.contains(top);
    });
    links.forEach((link, index) => {
      link.dataset["e2eLink"] = String(index);
    });
    return links.length;
  });
}

/** Follow the menu links with these labels, from the current page. */
async function goTo(app: Locator, ...labels: string[]) {
  for (const label of labels) {
    await markMenuLinks(app);
    await app
      .locator("[data-e2e-link]")
      .filter({ has: app.page().getByText(label, { exact: true }) })
      .click();
    await expect(
      app.locator('nav[aria-label="Breadcrumbs"] [aria-current="page"]'),
    ).toHaveText(label, { ignoreCase: true });
  }
}

test("every settings page renders", async ({ page }) => {
  const app = await openSystemSettings(page);
  const crumbs = app.locator('nav[aria-label="Breadcrumbs"]');
  const visited: string[] = [];

  async function visitMenu(depth: number) {
    const count = await markMenuLinks(app);
    for (let index = 0; index < count; index++) {
      if (index > 0) await markMenuLinks(app);
      const link = app.locator(`[data-e2e-link="${index}"]`);
      const label = (await link.innerText()).split("\n")[0];
      await link.click();
      await expect(crumbs.locator('[aria-current="page"]')).toHaveText(label, {
        ignoreCase: true,
      });
      visited.push(`${"  ".repeat(depth)}${label}`);
      if (depth < 4) await visitMenu(depth + 1);
      // back up a level
      await crumbs.locator("a").last().click();
    }
  }

  await visitMenu(0);
  expect(visited.length).toBeGreaterThan(7);
});

test("changing a setting and saving it", async ({ page }) => {
  // make sure it starts off, and goes back to how it was afterwards
  await setSettings(page, { useDamageApplication: false });
  const app = await openSystemSettings(page);
  await goTo(app, "Combat", "Combat options");
  await app.getByLabel("Use damage application?").click();
  // more options appear
  await expect(app.getByLabel("Use critical hits?")).toBeVisible();
  await app.getByRole("button", { name: "Save changes" }).click();
  await expect(app).toBeHidden();
  expect(
    await page.evaluate(
      () =>
        game.settings.get(
          "investigator",
          "useDamageApplication" as never,
        ) as unknown,
    ),
  ).toBe(true);
});

test("an equipment category's fields show up on equipment", async ({
  page,
}) => {
  await setSettings(page, {
    equipmentCategories: await page.evaluate(() =>
      game.settings.get("investigator", "equipmentCategories" as never),
    ),
  });
  const app = await openSystemSettings(page);
  await goTo(app, "Equipment categories");
  // adding a category or field takes you to its page
  await app
    .getByRole("button", { name: "Add a new equipment category" })
    .click();
  await app.getByLabel("Category name").fill("Gadgets");
  await app
    .getByRole("button", { name: "Add a new field to this category" })
    .click();
  await app.getByLabel("Name", { exact: true }).fill("Charge");
  await app.getByLabel("Type").selectOption("number");
  await app.getByRole("button", { name: "Save changes" }).click();
  await expect(app).toBeHidden();

  const itemId = await page.evaluate(async () => {
    const item = await Item.create({ name: "Ray gun", type: "equipment" });
    return item!.id;
  });
  const sheet = await openSheet(page, `Item.${itemId}`);
  await sheet.getByLabel("Category").selectOption({ label: "Gadgets" });
  const charge = sheet.getByLabel("Charge");
  await charge.fill("3");
  await charge.blur();
  await expect
    .poll(() =>
      page.evaluate(
        (itemId) => Object.values(game.items.get(itemId)!.system.fields ?? {}),
        itemId,
      ),
    )
    .toEqual([3]);
});
