import type { Page } from "@playwright/test";

import { createActor, expect, test } from "./foundry.ts";

async function getHealth(page: Page, actorId: string) {
  return page.evaluate((id) => {
    const actor = game.actors.get(id)!;
    return {
      pool: actor.items.getName("Health")!.system.pool as number,
      resource: (
        actor.system as unknown as {
          resources: { health?: { value: number } };
        }
      ).resources.health?.value,
    };
  }, actorId);
}

for (const type of ["pc", "npc"] as const) {
  test(`quick changes to a ${type}'s Health settle on the last one`, async ({
    page,
  }) => {
    const actorId = await createActor(page, { name: "Hasty", type });
    await page.evaluate(async (id) => {
      const health = game.actors.get(id)!.items.getName("Health")!;
      await health.update({ system: { rating: 10, pool: 10 } });
      // like clicking the minus button three times, quickly
      void health.update({ system: { pool: 9 } });
      void health.update({ system: { pool: 8 } });
      void health.update({ system: { pool: 7 } });
    }, actorId);
    // let any echoes play out
    await page.waitForTimeout(2000);
    expect(await getHealth(page, actorId)).toEqual({ pool: 7, resource: 7 });
  });
}

test("quick changes to Health from the token bar settle on the last one", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Barred", type: "npc" });
  await page.evaluate(async (id) => {
    const actor = game.actors.get(id)!;
    await actor.items
      .getName("Health")!
      .update({ system: { rating: 10, pool: 10 } });
    // the token bar changes the resource, not the ability
    for (const value of [9, 8, 7]) {
      void actor.update({ system: { resources: { health: { value } } } });
    }
  }, actorId);
  await page.waitForTimeout(2000);
  expect(await getHealth(page, actorId)).toEqual({ pool: 7, resource: 7 });
});
