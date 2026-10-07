import { test as base, type Page } from "@playwright/test";

/** Wait until Foundry has finished loading the world in this page. */
export async function waitForGameReady(page: Page) {
  await page.waitForFunction(
    () => (globalThis as { game?: foundry.Game }).game?.ready === true,
    null,
    {
      timeout: 30_000,
    },
  );
}

/**
 * Playwright's `test`, with `page` already in the game as the Gamemaster.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto("/game");
    await waitForGameReady(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
