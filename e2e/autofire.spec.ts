import type { Locator, Page } from "@playwright/test";

import { getTokenHealth, rifle, setUpFight } from "./fight.ts";
import {
  expect,
  forceDice,
  lastChatMessage,
  openSheet,
  setSettings,
  targetTokens,
  test,
  updateAbility,
} from "./foundry.ts";

test.use({ canvas: true });

/**
 * Click the option labelled `option` in the row of check buttons labelled
 * `row`.
 */
async function choose(sheet: Locator, row: string, option: string) {
  await sheet
    .locator("label", { hasText: new RegExp(`^${row}$`) })
    .locator("xpath=following-sibling::div[1]")
    .locator("label", { hasText: new RegExp(`^${option}$`) })
    .click();
}

async function getWeapon(page: Page, pcId: string, weaponId: string) {
  return page.evaluate(
    ({ pcId, weaponId }) => {
      const system = game.actors.get(pcId)!.items.get(weaponId)!
        .system as unknown as {
        ammo: { value: number };
        jammed: boolean;
      };
      return { ammo: system.ammo.value, jammed: system.jammed };
    },
    { pcId, weaponId },
  );
}

test.beforeEach(async ({ page }) => {
  await setSettings(page, {
    useLethalityAndAutofire: true,
    useGunfireOnHumans: false,
    useCriticalHits: false,
    useShotDryAndJams: false,
  });
});

test("a three-round burst hits up to three times, one after another", async ({
  page,
}) => {
  const {
    pcId,
    weaponId,
    npcTokenIds: [cultist],
  } = await setUpFight(page, { weapon: rifle });
  await targetTokens(page, [cultist]);
  await forceDice(page, 6);

  const sheet = await openSheet(page, `Actor.${pcId}.Item.${weaponId}`);
  await choose(sheet, "Fire mode", "Burst");
  await choose(sheet, "Spend", "3");
  await sheet.getByRole("button", { name: "Fire Weapon" }).click();

  // 6 + 3 = 9 against Hit Threshold 3 is a margin of 6: three bullets
  const card = lastChatMessage(page);
  await expect(card).toContainText("Hit roll: 6+3");
  await card.getByRole("button", { name: "Apply damage" }).click();
  await expect.poll(() => getTokenHealth(page, cultist)).toBe(-8);
  expect(await getWeapon(page, pcId, weaponId)).toMatchObject({ ammo: 27 });
});

test("full-auto hits everyone targeted, with Lethality", async ({ page }) => {
  const {
    pcId,
    weaponId,
    npcTokenIds: [first, second],
  } = await setUpFight(page, { weapon: rifle, cultists: 2 });
  await targetTokens(page, [first, second]);
  await forceDice(page, 6);

  const sheet = await openSheet(page, `Actor.${pcId}.Item.${weaponId}`);
  await choose(sheet, "Fire mode", "Full-auto");
  await choose(sheet, "Firearms", "5");
  await sheet.getByRole("button", { name: "Fire Weapon" }).click();

  // L1 with a 6 on the Lethality die: 5 × 1 + 6 = 11 damage each
  const card = lastChatMessage(page);
  // each one re-renders the card, so click whichever is left
  const applyButtons = card.getByRole("button", { name: "Apply damage" });
  await expect(applyButtons).toHaveCount(2);
  await applyButtons.first().click();
  await expect(applyButtons).toHaveCount(1);
  await applyButtons.first().click();
  await expect(applyButtons).toHaveCount(0);
  await expect.poll(() => getTokenHealth(page, first)).toBe(-1);
  await expect.poll(() => getTokenHealth(page, second)).toBe(-1);
  expect(await getWeapon(page, pcId, weaponId)).toMatchObject({ ammo: 20 });
});

test("a Lethality weapon kills on a low roll", async ({ page }) => {
  const {
    pcId,
    weaponId,
    npcTokenIds: [cultist],
  } = await setUpFight(page, {
    weapon: {
      ...rifle,
      fireModes: "single",
      lethality: { rating: 1, asterisks: 0, hs: 0 },
    },
  });
  await targetTokens(page, [cultist]);
  await forceDice(page, 1);

  const sheet = await openSheet(page, `Actor.${pcId}.Item.${weaponId}`);
  // 1 + 2 meets Hit Threshold 3
  await choose(sheet, "Spend", "2");
  await sheet.getByRole("button", { name: "Fire Weapon" }).click();

  const card = lastChatMessage(page);
  await card.getByRole("button", { name: "Apply damage" }).click();
  await expect.poll(() => getTokenHealth(page, cultist)).toBe(-12);
  await expect(card).toContainText("Dead");
});

test("two 1s in a row on full-auto jam the weapon", async ({ page }) => {
  await setSettings(page, { useShotDryAndJams: true });
  const {
    pcId,
    weaponId,
    npcTokenIds: [cultist],
  } = await setUpFight(page, { weapon: rifle });
  // enough for two full-auto spends
  await updateAbility(page, pcId, "Firearms", { rating: 12, pool: 12 });
  await targetTokens(page, [cultist]);
  await forceDice(page, 1);

  const sheet = await openSheet(page, `Actor.${pcId}.Item.${weaponId}`);
  for (let shot = 0; shot < 2; shot++) {
    await choose(sheet, "Fire mode", "Full-auto");
    await choose(sheet, "Firearms", "5");
    await sheet.getByRole("button", { name: "Fire Weapon" }).click();
    await expect(lastChatMessage(page)).toContainText("Hit roll: 1+5");
  }
  await expect
    .poll(() => getWeapon(page, pcId, weaponId))
    .toMatchObject({
      jammed: true,
    });

  await sheet.getByRole("button", { name: "Clear jam" }).click();
  await expect
    .poll(() => getWeapon(page, pcId, weaponId))
    .toMatchObject({
      jammed: false,
    });
});

test("walking a burst's fire onto another target", async ({ page }) => {
  await setSettings(page, { useWalkingFire: true });
  const {
    pcId,
    weaponId,
    npcTokenIds: [first, second],
  } = await setUpFight(page, { weapon: rifle, cultists: 2 });
  await targetTokens(page, [first]);
  // 1 + 3 = 4 against Hit Threshold 3 is one bullet, leaving two to walk
  await forceDice(page, 1);

  const sheet = await openSheet(page, `Actor.${pcId}.Item.${weaponId}`);
  await choose(sheet, "Fire mode", "Burst");
  await choose(sheet, "Spend", "3");
  await sheet.getByRole("button", { name: "Fire Weapon" }).click();

  const card = lastChatMessage(page);
  await expect(card).toContainText("Cultist 1");
  await targetTokens(page, [second]);
  await card.getByRole("button", { name: "2 Firearms", exact: true }).click();
  await expect(card).toContainText("Cultist 2");
  await expect(card).toContainText("walked fire");
  await expect
    .poll(() =>
      page.evaluate(
        (pcId) =>
          game.actors.get(pcId)!.items.getName("Firearms")!.system
            .pool as number,
        pcId,
      ),
    )
    .toBe(1);
});
