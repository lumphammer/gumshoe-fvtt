import type { Page } from "@playwright/test";

import { expect, reloadGame, setSettings, test } from "./foundry.ts";

function getSetting(page: Page, key: string) {
  return page.evaluate(
    (key) => game.settings.get("investigator", key as never) as unknown,
    key,
  );
}

/** A Trail of Cthulhu world from before its preset had these rules */
async function makeOldTrailOfCthulhuWorld(page: Page) {
  await setSettings(page, {
    systemPreset: "pathOfCthulhuPreset",
    offeredTrailOfCthulhuRules: false,
    useStabilityRules: false,
    useSanityRules: false,
    useStabilityStates: false,
    stabilityStates: {
      shaken: { name: "Shaken", upTo: 0 },
      shattered: { name: "Shattered", upTo: -6 },
      gone: { name: "Gone", upTo: -12 },
    },
    useTrauma: false,
    traumaTypes: [],
  });
}

const offer = (page: Page) =>
  page
    .locator(".application.dialog")
    .filter({ hasText: "Trail of Cthulhu now has optional" });

test("a new world gets the Trail of Cthulhu rules", async ({ page }) => {
  // the test world was made fresh for this run
  expect(await getSetting(page, "useStabilityRules")).toBe(true);
  expect(await getSetting(page, "useSanityRules")).toBe(true);
  expect(await getSetting(page, "stabilityStates")).toMatchObject({
    shattered: { name: "Blasted" },
    gone: { name: "Doomed" },
  });
  // so it's never asked
  await expect(offer(page)).toHaveCount(0);
});

test("an older Trail of Cthulhu world is offered the rules, once", async ({
  page,
}) => {
  await makeOldTrailOfCthulhuWorld(page);
  await reloadGame(page);
  await expect(offer(page)).toContainText(
    "(You can change this later in GUMSHOE System Settings.)",
  );
  await offer(page).getByRole("button", { name: "Yes please!" }).click();

  await expect.poll(() => getSetting(page, "useStabilityRules")).toBe(true);
  expect(await getSetting(page, "useSanityRules")).toBe(true);
  expect(await getSetting(page, "useTrauma")).toBe(true);
  expect(await getSetting(page, "stabilityStates")).toMatchObject({
    shaken: { name: "Shaken" },
    shattered: { name: "Blasted" },
  });
  expect(await getSetting(page, "traumaTypes")).toMatchObject([
    { name: "Non-mythos", causesSanityLoss: false },
    { name: "Mythos", causesSanityLoss: true },
  ]);
  expect(await getSetting(page, "offeredTrailOfCthulhuRules")).toBe(true);
});

test("saying no to the Trail of Cthulhu rules leaves them off", async ({
  page,
}) => {
  await makeOldTrailOfCthulhuWorld(page);
  await reloadGame(page);
  await offer(page).getByRole("button", { name: "No thanks" }).click();
  await expect
    .poll(() => getSetting(page, "offeredTrailOfCthulhuRules"))
    .toBe(true);
  expect(await getSetting(page, "useStabilityRules")).toBe(false);

  // and it isn't asked again
  await reloadGame(page);
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 500)));
  await expect(offer(page)).toHaveCount(0);
});

test("other presets' worlds aren't offered the rules", async ({ page }) => {
  await makeOldTrailOfCthulhuWorld(page);
  await setSettings(page, { systemPreset: "esoterroristsPreset" });
  await reloadGame(page);
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 500)));
  await expect(offer(page)).toHaveCount(0);
});
