import type { Page } from "@playwright/test";

import {
  createActor,
  expect,
  openSheet,
  setSettings,
  test,
  updateAbility,
} from "./foundry.ts";

async function getStatuses(page: Page, actorId: string) {
  return page.evaluate(
    (actorId) =>
      [...game.actors.get(actorId)!.statuses]
        .filter((s) => ["hurt", "seriouslyWounded", "dead"].includes(s))
        .sort(),
    actorId,
  );
}

test.afterEach(async ({ page }) => {
  await setSettings(page, { useWoundStatusEffects: false });
});

test("wound statuses and badges follow Health", async ({ page }) => {
  await setSettings(page, { useWoundStatusEffects: true });
  const actorId = await createActor(page, { name: "Battered", type: "pc" });
  await updateAbility(page, actorId, "Health", {
    rating: 8,
    pool: 8,
    showTracker: true,
  });
  const healthId = await page.evaluate(
    (actorId) => game.actors.get(actorId)!.items.getName("Health")!.id,
    actorId,
  );
  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  const abilitySheet = await openSheet(
    page,
    `Actor.${actorId}.Item.${healthId}`,
  );
  const trackerBadge = actorSheet
    .getByTestId("pool-tracker")
    .filter({ hasText: "Health" })
    .getByTestId("wound-state-badge");
  const sheetBadge = abilitySheet.getByTestId("wound-state-badge");
  await expect(trackerBadge).toHaveCount(0);
  await expect(sheetBadge).toHaveCount(0);

  for (const [pool, status, label] of [
    [0, "hurt", "Hurt"],
    [-6, "seriouslyWounded", "Seriously Wounded"],
    [-12, "dead", "Dead"],
  ] as const) {
    await updateAbility(page, actorId, "Health", { pool });
    await expect.poll(() => getStatuses(page, actorId)).toEqual([status]);
    await expect(trackerBadge).toHaveText(label);
    await expect(sheetBadge).toHaveText(label);
  }

  await updateAbility(page, actorId, "Health", { pool: 5 });
  await expect.poll(() => getStatuses(page, actorId)).toEqual([]);
  await expect(trackerBadge).toHaveCount(0);
  await expect(sheetBadge).toHaveCount(0);
});
