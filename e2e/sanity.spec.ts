import type { Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  setSettings,
  test,
  updateAbility,
} from "./foundry.ts";
import { stabilityRulesOn } from "./stabilitySettings.ts";
import { goTo, openSystemSettings } from "./systemSettings.ts";

async function getAbility(page: Page, actorId: string, abilityName: string) {
  return page.evaluate(
    ({ actorId, abilityName }) => {
      const system = game.actors.get(actorId)!.items.getName(abilityName)!
        .system as unknown as { rating: number; pool: number };
      return { rating: system.rating, pool: system.pool };
    },
    { actorId, abilityName },
  );
}

async function openAbilitySheet(page: Page, actorId: string, name: string) {
  const id = await page.evaluate(
    ({ actorId, name }) => game.actors.get(actorId)!.items.getName(name)!.id,
    { actorId, name },
  );
  return openSheet(page, `Actor.${actorId}.Item.${id}`);
}

test("Sanity's rating is capped by Cthulhu Mythos", async ({ page }) => {
  await setSettings(page, {
    ...stabilityRulesOn,
    useSanityRules: true,
    sanityAbility: "Sanity",
    sanityCapAbility: "Cthulhu Mythos",
    sanityCapBase: 10,
  });
  const actorId = await createActor(page, { name: "Doomed", type: "pc" });
  await updateAbility(page, actorId, "Sanity", { rating: 8, pool: 8 });
  const sheet = await openAbilitySheet(page, actorId, "Sanity");

  // Cthulhu Mythos 4 caps Sanity at 6, so it can't go above that
  await updateAbility(page, actorId, "Cthulhu Mythos", { rating: 4 });
  await expect
    .poll(() => getAbility(page, actorId, "Sanity"))
    .toEqual({ rating: 6, pool: 6 });
  await updateAbility(page, actorId, "Sanity", { rating: 9 });
  expect((await getAbility(page, actorId, "Sanity")).rating).toBe(6);
  await expect(sheet.getByTestId("rating-cap-badge")).toHaveText("Capped at 6");
  await expect(
    sheet.getByTestId("rating-cap-badge").locator("[title]"),
  ).toHaveAttribute("title", "10 less Cthulhu Mythos");

  // more Mythos brings Sanity down, without asking; a pool below the new
  // cap stays where it is
  await updateAbility(page, actorId, "Sanity", { pool: 2 });
  await updateAbility(page, actorId, "Cthulhu Mythos", { rating: 7 });
  await expect
    .poll(() => getAbility(page, actorId, "Sanity"))
    .toEqual({ rating: 3, pool: 2 });

  // otherwise it's an ordinary ability
  await expect(sheet.getByRole("button", { name: "Test" })).toBeVisible();

  // and with Sanity rules off, there's no cap
  await setSettings(page, { useSanityRules: false });
  await updateAbility(page, actorId, "Sanity", { rating: 9 });
  expect((await getAbility(page, actorId, "Sanity")).rating).toBe(9);
});

test("the Sanity & Stability settings use the abilities' names", async ({
  page,
}) => {
  await setSettings(page, {
    ...stabilityRulesOn,
    stabilityAbility: "Composure",
    useSanityRules: true,
    sanityAbility: "Humanity",
    traumaTypes: [],
  });
  const app = await openSystemSettings(page);
  await goTo(app, "Sanity & Stability");
  await expect(app.getByLabel("Use Composure rules?")).toBeVisible();
  await expect(app.getByLabel("Humanity rating capped by")).toBeVisible();
  await expect(app.getByLabel("Base Humanity cap")).toBeVisible();

  // a trauma type, made here, shows up on the Stability sheet
  await goTo(app, "Trauma types");
  await app.getByRole("button", { name: "Add trauma type" }).click();
  const typePage = app.getByTestId("trauma-type-settings");
  await typePage.getByLabel("Name", { exact: true }).fill("Gore");
  // the breadcrumb gets shorter, moving the page up: let it settle
  await expect(
    app.locator('nav[aria-label="Breadcrumbs"] [aria-current="page"]'),
  ).toHaveText("Gore", { ignoreCase: true });
  await expect(
    typePage.getByLabel("Trauma causes Humanity losses?"),
  ).toBeVisible();
  // adapting's options only show when it's on
  await expect(typePage.getByLabel("Caps Bonds?")).toHaveCount(0);
  await typePage.getByLabel("Use adaptation?").click();
  await expect(typePage.getByLabel("Caps Bonds?")).toBeVisible();
  await app.getByRole("button", { name: "Save changes" }).click();
  await expect(app).toBeHidden();

  const actorId = await createActor(page, { name: "Steady", type: "pc" });
  await createOwnedItem(page, actorId, {
    name: "Composure",
    type: "generalAbility",
  });
  const sheet = await openAbilitySheet(page, actorId, "Composure");
  await expect(
    sheet.getByLabel("Trauma").locator("option", { hasText: "Gore" }),
  ).toHaveCount(1);
});
