import type { Locator, Page } from "@playwright/test";

import { expect } from "./foundry.ts";

/** Open the system's settings app. Returns a locator for it. */
export async function openSystemSettings(page: Page) {
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
export async function markMenuLinks(app: Locator) {
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
export async function goTo(app: Locator, ...labels: string[]) {
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
