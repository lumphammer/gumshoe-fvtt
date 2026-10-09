import type { Page } from "@playwright/test";

import {
  createActor,
  createPlayer,
  expect,
  giveOwnership,
  setSettings,
  test,
} from "./foundry.ts";

/** Show the combat tracker in the sidebar. Returns a locator for it. */
async function openCombatTracker(page: Page) {
  await page.evaluate(() => {
    ui.sidebar.changeTab("combat", "primary");
  });
  const tracker = page.locator("#combat");
  await expect(tracker).toBeVisible();
  return tracker;
}

/** Add these actors to the active combat, in order. */
async function addCombatants(page: Page, actorIds: string[]) {
  await page.evaluate(async (actorIds) => {
    await game.combat!.createEmbeddedDocuments(
      "Combatant",
      actorIds.map((actorId) => ({ actorId })),
    );
  }, actorIds);
}

async function getCombat(page: Page) {
  return page.evaluate(() => {
    const combat = game.combat;
    return combat
      ? {
          type: combat.type,
          round: combat.round,
          turn: combat.turn,
          current: combat.combatant?.name ?? null,
        }
      : null;
  });
}

test.afterEach(async ({ page }) => {
  // combats belong to no scene, so they'd pile up across tests
  await page.evaluate(async () => {
    await Combat.deleteDocuments(game.combats.map((combat) => combat.id));
  });
});

test("the GM runs a classic combat from the tracker", async ({ page }) => {
  await setSettings(page, { useTurnPassingInitiative: false });
  const tracker = await openCombatTracker(page);
  await tracker.getByRole("button", { name: "Create Combat" }).click();
  await expect.poll(() => getCombat(page)).toMatchObject({ type: "classic" });

  const fastId = await createActor(page, { name: "Fast", type: "pc" });
  const slowId = await createActor(page, { name: "Slow", type: "pc" });
  await addCombatants(page, [slowId, fastId]);
  await page.evaluate(async () => {
    for (const combatant of game.combat!.combatants) {
      await combatant.update({
        system: { initiative: combatant.name === "Fast" ? 10 : 1 },
      });
    }
  });

  // turn order is up to the GM; sorting puts it in initiative order
  await tracker.getByRole("button", { name: "Sort Combatants" }).click();
  await tracker.getByRole("button", { name: "Start Combat" }).click();
  await expect
    .poll(() => getCombat(page))
    .toMatchObject({ round: 1, current: "Fast" });
  await tracker.getByRole("button", { name: "Next Turn" }).first().click();
  await expect
    .poll(() => getCombat(page))
    .toMatchObject({ round: 1, current: "Slow" });
  await tracker.getByRole("button", { name: "Next Turn" }).first().click();
  await expect
    .poll(() => getCombat(page))
    .toMatchObject({ round: 2, current: "Fast" });
});

test("a player takes their turn in a turn-passing combat", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, { useTurnPassingInitiative: true });
  const pcId = await createActor(page, { name: "Hero", type: "pc" });
  const npcId = await createActor(page, { name: "Villain", type: "npc" });
  const playerId = await createPlayer(page, "Player Two");
  await giveOwnership(page, pcId, playerId);
  await page.evaluate(async () => {
    const combat = await Combat.implementation.create({ type: "turnPassing" });
    await combat!.activate();
  });
  await addCombatants(page, [npcId, pcId]);
  const tracker = await openCombatTracker(page);
  await tracker.getByRole("button", { name: "Start Combat" }).click();
  await expect.poll(() => getCombat(page)).toMatchObject({ round: 1 });

  const player = await joinAs("Player Two");
  const playerTracker = await openCombatTracker(player);
  const heroRow = playerTracker.locator("li", { hasText: "Hero" });
  await heroRow.getByTitle("Turn").click();

  // the GM's client carries out the turn pass
  await expect.poll(() => getCombat(page)).toMatchObject({ current: "Hero" });
  await expect(heroRow).toContainText("0/1");
});

test("in turn-passing, everyone acts, then a new round gives turns back", async ({
  page,
}) => {
  await setSettings(page, { useTurnPassingInitiative: true });
  const heroId = await createActor(page, { name: "Hero", type: "pc" });
  const villainId = await createActor(page, { name: "Villain", type: "npc" });
  await page.evaluate(async () => {
    const combat = await Combat.implementation.create({ type: "turnPassing" });
    await combat!.activate();
  });
  await addCombatants(page, [heroId, villainId]);
  const tracker = await openCombatTracker(page);
  await tracker.getByRole("button", { name: "Start Combat" }).click();

  const hero = tracker.locator("li", { hasText: "Hero" });
  const villain = tracker.locator("li", { hasText: "Villain" });
  await villain.getByTitle("Turn").click();
  await expect
    .poll(() => getCombat(page))
    .toMatchObject({ current: "Villain" });
  await hero.getByTitle("Turn").click();
  await expect.poll(() => getCombat(page)).toMatchObject({ current: "Hero" });
  await expect(hero).toContainText("0/1");
  await expect(villain).toContainText("0/1");
  // nobody has turns left, so taking another does nothing
  await villain.getByTitle("Turn").click();
  await expect.poll(() => getCombat(page)).toMatchObject({ current: "Hero" });

  await tracker.getByRole("button", { name: "Next Round" }).first().click();
  await expect.poll(() => getCombat(page)).toMatchObject({ round: 2 });
  await expect(hero).toContainText("1/1");
  await expect(villain).toContainText("1/1");
});

test("a player can't take a turn for a combatant they don't own", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, { useTurnPassingInitiative: true });
  const heroId = await createActor(page, { name: "Hero", type: "pc" });
  const villainId = await createActor(page, { name: "Villain", type: "npc" });
  const playerId = await createPlayer(page, "Player Three");
  await giveOwnership(page, heroId, playerId);
  await page.evaluate(async () => {
    const combat = await Combat.implementation.create({ type: "turnPassing" });
    await combat!.activate();
  });
  await addCombatants(page, [heroId, villainId]);
  const tracker = await openCombatTracker(page);
  await tracker.getByRole("button", { name: "Start Combat" }).click();

  const player = await joinAs("Player Three");
  const playerTracker = await openCombatTracker(player);
  const villain = playerTracker.locator("li", { hasText: "Villain" });
  if ((await villain.getByTitle("Turn").count()) > 0) {
    await villain.getByTitle("Turn").click();
  }
  // give the GM's client time to (not) act on it
  await page.waitForTimeout(2000);
  expect(await getCombat(page)).toMatchObject({ current: null });
  await expect(tracker.locator("li", { hasText: "Villain" })).toContainText(
    "1/1",
  );
});
