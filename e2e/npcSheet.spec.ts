import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  setSettings,
  test,
} from "./foundry.ts";

// The NPC sheet's header and sidebar are memoised, and read the actor through
// snapshots: these check that changes made elsewhere still reach them.

test.afterEach(async ({ page }) => {
  await setSettings(page, { useTurnPassingInitiative: false });
});

test("the NPC sidebar and combat tab follow initiative, turns and trackers changed elsewhere", async ({
  page,
}) => {
  await setSettings(page, { useTurnPassingInitiative: true });
  const actorId = await createActor(page, { name: "Goon", type: "npc" });
  const abilityId = await createOwnedItem(page, actorId, {
    name: "Brawling",
    type: "generalAbility",
    system: { rating: 4, pool: 4, showTracker: true },
  });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const tracker = sheet
    .getByTestId("pool-tracker")
    .filter({ hasText: "Brawling" });
  await expect(tracker).toBeVisible();

  const initiative = sheet
    .locator("h3", { hasText: "Initiative" })
    .locator("xpath=following-sibling::*[1]")
    .locator("select");
  const turns = sheet
    .locator("h4", { hasText: "Number of turns" })
    .locator("xpath=following-sibling::*[1]")
    .locator("input")
    .last();

  const next = await page.evaluate(async (actorId) => {
    const actor = game.actors.get(actorId)!;
    const current = (actor.system as unknown as { initiativeAbility: string })
      .initiativeAbility;
    const next = current === "Scuffling" ? "Athletics" : "Scuffling";
    await actor.update({
      system: { initiativeAbility: next, initiativePassingTurns: 3 },
    });
    return next;
  }, actorId);
  await expect(turns).toHaveValue("3");
  // the initiative ability is on the combat tab
  await sheet.locator(".tab-strip > label", { hasText: "Combat" }).click();
  await expect(initiative).toHaveValue(next);

  // the tracker goes when it's turned off elsewhere
  await page.evaluate(
    async ({ actorId, abilityId }) => {
      await game.actors
        .get(actorId)!
        .items.get(abilityId)!
        .update({ system: { showTracker: false } });
    },
    { actorId, abilityId },
  );
  await expect(tracker).toHaveCount(0);
});

test("the NPC's notes and edit-mode weapons follow changes made elsewhere", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Thug", type: "npc" });
  const clubId = await createOwnedItem(page, actorId, {
    name: "Club",
    type: "weapon",
    system: { damage: 1 },
  });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const tab = (name: string) =>
    sheet.locator(".tab-strip > label", { hasText: name }).first().click();

  await tab("Notes");
  await page.evaluate(async (actorId) => {
    await game.actors
      .get(actorId)!
      .update({ system: { notes: "<p>Owes the Dons money</p>" } });
  }, actorId);
  await expect(sheet).toContainText("Owes the Dons money");

  await tab("Combat");
  await sheet.getByLabel("Edit mode").click();
  await expect(sheet.locator('input[value="Club"]')).toHaveCount(1);
  await page.evaluate(
    async ({ actorId, clubId }) => {
      await game.actors
        .get(actorId)!
        .items.get(clubId)!
        .update({ name: "Cosh", system: { damage: 2 } });
    },
    { actorId, clubId },
  );
  await expect
    .poll(() =>
      sheet
        .locator("input")
        .evaluateAll((inputs) =>
          inputs.map((input) => (input as HTMLInputElement).value),
        ),
    )
    .toContain("Cosh");
});
