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

test("the GM reorders a classic combat by dragging a row", async ({ page }) => {
  await setSettings(page, { useTurnPassingInitiative: false });
  const tracker = await openCombatTracker(page);
  await tracker.getByRole("button", { name: "Create Combat" }).click();
  await expect.poll(() => getCombat(page)).toMatchObject({ type: "classic" });
  const ids: string[] = [];
  for (const name of ["Alpha", "Bravo", "Charlie"]) {
    ids.push(await createActor(page, { name, type: "pc" }));
  }
  await addCombatants(page, ids);
  const names = tracker.locator("li.combatant .name");
  await expect(names).toHaveCount(3);
  // they have the same initiative, so they can start in any order
  const [first, second, last] = (await names.allTextContents()).map((name) =>
    name.trim(),
  );

  // the row's drag wiring goes through its context (so its context menu's
  // root doesn't re-render): drag the last row's grip above the first
  const grip = tracker
    .locator("li.combatant", { hasText: last })
    .locator(".drag-handle");
  const target = tracker.locator("li.combatant", { hasText: first });
  const from = (await grip.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, to.y + 2, { steps: 15 });
  await page.mouse.up();

  await expect(names).toHaveText([last, first, second]);
  await expect
    .poll(() =>
      page.evaluate(() =>
        game.combat!.turns.map((combatant) => combatant.name),
      ),
    )
    .toEqual([last, first, second]);
});

test("the tracker follows turns and initiative changed elsewhere", async ({
  page,
}) => {
  // the rows' contents are memoised: only what changed should re-render, but
  // the highlight and the numbers must still follow
  await setSettings(page, { useTurnPassingInitiative: false });
  const tracker = await openCombatTracker(page);
  const ids = [
    await createActor(page, { name: "First", type: "pc" }),
    await createActor(page, { name: "Second", type: "pc" }),
    await createActor(page, { name: "Third", type: "pc" }),
  ];
  await page.evaluate(async () => {
    await Combat.create({ active: true, type: "classic" });
  });
  await addCombatants(page, ids);
  await page.evaluate(async () => {
    await game.combat!.startCombat();
  });
  const active = tracker.locator("li.combatant.active");
  await expect(active).toHaveCount(1);
  const first = (await getCombat(page))!.current!;
  await expect(active).toContainText(first);

  await page.evaluate(async () => {
    await game.combat!.nextTurn();
  });
  const second = (await getCombat(page))!.current!;
  expect(second).not.toBe(first);
  await expect(active).toHaveCount(1);
  await expect(active).toContainText(second);

  await page.evaluate(async () => {
    const combatant = game.combat!.combatants.find((c) => c.name === "Third")!;
    await combatant.update({ system: { initiative: 7 } });
  });
  const third = tracker.locator("li.combatant", { hasText: "Third" });
  await expect(third.locator("input")).toHaveValue("7");

  // the header takes the round as a prop: it follows a new round
  const header = tracker.locator(".combat-tracker-header");
  await expect(header).toContainText("Round 1");
  await page.evaluate(async () => {
    await game.combat!.nextRound();
  });
  await expect(header).toContainText("Round 2");
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
  // the rows are memoised: whose turn it is reaches them through their own
  // context, so the GM's tracker shows it (a play icon) on Hero's row only
  const gmRow = (name: string) => tracker.locator("li", { hasText: name });
  await expect(gmRow("Hero").locator(".fa-play")).toHaveCount(1);
  await expect(gmRow("Villain").locator(".fa-play")).toHaveCount(0);
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

  // going back to round 1 updates no combatants (their turns there are
  // already recorded): the rows still follow the round, and the inactive
  // ones are shaded as depleted again
  await page.evaluate(async () => {
    await game.combat!.previousRound();
  });
  await expect.poll(() => getCombat(page)).toMatchObject({ round: 1 });
  await expect(hero).toContainText("0/1");
  await expect(villain).toContainText("0/1");
  const inactive = tracker.locator("li.combatant:not(.active)");
  await expect(inactive).not.toHaveCount(0);
  for (const row of await inactive.all()) {
    await expect(row).toHaveCSS("opacity", "0.7");
  }
});

test("in turn-passing, the GM adds and removes turns from a row's menus", async ({
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
  await expect.poll(() => getCombat(page)).toMatchObject({ round: 1 });

  const hero = tracker.locator("li", { hasText: "Hero" });
  await expect(hero).toContainText("1/1");
  // the dropdown (the menu is memoised apart from the row)
  await hero.locator('button[aria-haspopup="menu"]').click();
  await page.getByRole("menuitem", { name: "Add a turn" }).click();
  await expect(hero).toContainText("2/1");
  // and the same menu on right-click
  await hero.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Remove a turn" }).click();
  await expect(hero).toContainText("1/1");
  await hero.click({ button: "right" });
  await page.getByRole("menuitem", { name: "Remove a turn" }).click();
  await expect(hero).toContainText("0/1");
  await expect(tracker.locator("li", { hasText: "Villain" })).toContainText(
    "1/1",
  );
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
