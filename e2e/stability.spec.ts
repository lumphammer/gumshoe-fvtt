import type { Locator, Page } from "@playwright/test";

import {
  createActor,
  expect,
  forceDice,
  lastChatMessage,
  openSheet,
  setSettings,
  test,
  updateAbility,
} from "./foundry.ts";

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

async function getStatuses(page: Page, actorId: string) {
  return page.evaluate(
    (actorId) =>
      [...game.actors.get(actorId)!.statuses]
        .filter((s) => ["shaken", "shattered", "gone"].includes(s))
        .sort(),
    actorId,
  );
}

async function getActorSystem(page: Page, actorId: string) {
  return page.evaluate(
    (actorId) =>
      game.actors.get(actorId)!.system as unknown as {
        adaptations: { violence: number; helplessness: number };
        unnaturalShockSanityLoss: number;
      },
    actorId,
  );
}

async function openAbilitySheet(page: Page, actorId: string, name: string) {
  const id = await page.evaluate(
    ({ actorId, name }) => game.actors.get(actorId)!.items.getName(name)!.id,
    { actorId, name },
  );
  return openSheet(page, `Actor.${actorId}.Item.${id}`);
}

/** Pick a spend on an ability sheet's test panel, in the row with this label */
async function pickSpend(sheet: Locator, label: string, points: number) {
  await sheet
    .locator("label", { hasText: new RegExp(`^${label}$`) })
    .locator("xpath=following-sibling::div[1]")
    .getByText(String(points), { exact: true })
    .click();
}

test.beforeEach(async ({ page }) => {
  await setSettings(page, {
    useBonds: true,
    useStabilityStates: true,
    bondStabilityAbility: "Stability",
    sanityAbility: "Sanity",
    violenceCappedAbilities: ["Reassurance"],
  });
});

// other specs' PCs often have no Stability, which would make them Shaken
test.afterEach(async ({ page }) => {
  await setSettings(page, { useStabilityStates: false });
});

test("Shaken, Shattered and Gone follow the Stability pool", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Wobbly", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: 6 });
  const sheet = await openAbilitySheet(page, actorId, "Stability");
  await expect(sheet.getByTestId("stability-state-badge")).toHaveCount(0);

  await updateAbility(page, actorId, "Stability", { pool: 0 });
  await expect.poll(() => getStatuses(page, actorId)).toEqual(["shaken"]);
  await expect(sheet.getByTestId("stability-state-badge")).toHaveText("Shaken");

  await updateAbility(page, actorId, "Stability", { pool: -6 });
  await expect.poll(() => getStatuses(page, actorId)).toEqual(["shattered"]);

  await updateAbility(page, actorId, "Stability", { pool: -12 });
  await expect.poll(() => getStatuses(page, actorId)).toEqual(["gone"]);

  await updateAbility(page, actorId, "Stability", { pool: 3 });
  await expect.poll(() => getStatuses(page, actorId)).toEqual([]);
  await expect(sheet.getByTestId("stability-state-badge")).toHaveCount(0);
});

test("while Shaken, Investigative spends ask first, and tests remind", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Jittery", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: -1 });
  await updateAbility(page, actorId, "Reassurance", { rating: 2, pool: 2 });
  await updateAbility(page, actorId, "Athletics", { rating: 6, pool: 6 });

  const dialog = page.locator(".application.dialog");
  const reassurance = await openAbilitySheet(page, actorId, "Reassurance");
  await pickSpend(reassurance, "Spend", 1);
  await reassurance.getByRole("button", { name: "Spend" }).click();
  await expect(dialog).toContainText("Jittery is in no state");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  expect((await getAbility(page, actorId, "Reassurance")).pool).toBe(2);

  await pickSpend(reassurance, "Spend", 1);
  await reassurance.getByRole("button", { name: "Spend" }).click();
  await dialog.getByRole("button", { name: "Spend" }).click();
  await expect
    .poll(async () => (await getAbility(page, actorId, "Reassurance")).pool)
    .toBe(1);

  // a General test is at +1 Difficulty; tests don't have one yet, so the card
  // reminds
  const athletics = await openAbilitySheet(page, actorId, "Athletics");
  await athletics.getByRole("button", { name: "Test" }).click();
  await expect(lastChatMessage(page).getByTestId("shaken-reminder")).toHaveText(
    "Shaken: Difficulty +1",
  );
});

test("a Stability test against Violence leaves the Agent Shaken", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Rattled", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: 2 });
  await page.evaluate(async (actorId) => {
    await game.actors
      .get(actorId)!
      .update({ system: { adaptations: { violence: 2 } } });
  }, actorId);

  const sheet = await openAbilitySheet(page, actorId, "Stability");
  // an ordinary test until a trauma is chosen
  await expect(sheet.getByLabel("Potential loss")).toHaveCount(0);
  await sheet.getByLabel("Trauma").selectOption("violence");
  await sheet.getByLabel("Potential loss").selectOption("3");
  await expect(sheet.getByTestId("trauma-difficulty")).toHaveText(
    "(Difficulty 4)",
  );

  await forceDice(page, 1);
  await sheet.getByRole("button", { name: "Test" }).click();
  const card = lastChatMessage(page).getByTestId("trauma-test-card");
  await expect(card).toContainText("Violence: a 3-point Stability test");
  await expect(card.getByTestId("trauma-outcome")).toHaveText("Loses 3");
  await expect(card.getByTestId("trauma-stability")).toHaveText(
    "Stability: 2 → -1",
  );
  await expect(card.getByTestId("trauma-state")).toContainText("Shaken!");
  // becoming Shaken starts the run towards adapting again
  await expect(card.getByTestId("trauma-adaptation")).toHaveText(
    "Adapting to Violence: 2 → 0",
  );
  await expect
    .poll(() => getAbility(page, actorId, "Stability"))
    .toEqual({ rating: 6, pool: -1 });
  await expect.poll(() => getStatuses(page, actorId)).toEqual(["shaken"]);
  expect((await getActorSystem(page, actorId)).adaptations.violence).toBe(0);

  // Shaken now: the next test is at +1
  await expect(sheet.getByTestId("trauma-difficulty")).toHaveText(
    "(Difficulty 5)",
  );
});

test("a third loss to Violence adapts the Agent", async ({ page }) => {
  const actorId = await createActor(page, { name: "Calloused", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 8, pool: 8 });
  await updateAbility(page, actorId, "Reassurance", { rating: 3, pool: 3 });
  await page.evaluate(async (actorId) => {
    await game.actors
      .get(actorId)!
      .update({ system: { adaptations: { violence: 2 } } });
  }, actorId);

  const sheet = await openAbilitySheet(page, actorId, "Stability");
  await sheet.getByLabel("Trauma").selectOption("violence");
  await sheet.getByLabel("Potential loss").selectOption("2");
  await pickSpend(sheet, "Spend", 1);
  await forceDice(page, 1);
  await sheet.getByRole("button", { name: "Test" }).click();

  const card = lastChatMessage(page).getByTestId("trauma-test-card");
  await expect(card).toContainText("Spent: Stability 1");
  await expect(card.getByTestId("trauma-stability")).toHaveText(
    "Stability: 8 → 5",
  );
  await expect(card.getByTestId("trauma-adaptation")).toHaveText(
    "Adapting to Violence: 2 → 3 (Adapted)",
  );
  await expect
    .poll(async () => (await getActorSystem(page, actorId)).adaptations)
    .toEqual({ violence: 3, helplessness: 0 });
  // adapting caps the ratings, without asking
  await expect
    .poll(() => getAbility(page, actorId, "Reassurance"))
    .toEqual({ rating: 1, pool: 3 });
  // and tests against Violence are easier now
  await expect(sheet.getByTestId("trauma-difficulty")).toHaveText(
    "(Difficulty 2)",
  );
});

test("an Unnatural shock that Shatters costs Stability and Sanity", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Seer", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: 2 });
  await updateAbility(page, actorId, "Sanity", { rating: 5, pool: 5 });

  const sheet = await openAbilitySheet(page, actorId, "Stability");
  await sheet.getByLabel("Trauma").selectOption("unnatural");
  await sheet.getByLabel("Potential loss").selectOption("8");
  await expect(sheet.getByTestId("trauma-difficulty")).toHaveText(
    "(Difficulty 5)",
  );
  await forceDice(page, 1);
  await sheet.getByRole("button", { name: "Test" }).click();

  const card = lastChatMessage(page).getByTestId("trauma-test-card");
  await expect(card.getByTestId("trauma-stability")).toHaveText(
    "Stability: 2 → -6",
  );
  await expect(card.getByTestId("trauma-state")).toContainText("Shattered!");
  await expect(card.getByTestId("trauma-rating")).toHaveText(
    "Stability rating: 6 → 5",
  );
  await expect(card.getByTestId("trauma-sanity")).toHaveText(
    "Sanity rating: 5 → 3",
  );
  // never adapted to the Unnatural
  await expect(card.getByTestId("trauma-adaptation")).toHaveCount(0);
  await expect
    .poll(() => getAbility(page, actorId, "Stability"))
    .toEqual({ rating: 5, pool: -6 });
  expect(await getAbility(page, actorId, "Sanity")).toEqual({
    rating: 3,
    pool: 3,
  });
  expect((await getActorSystem(page, actorId)).unnaturalShockSanityLoss).toBe(
    2,
  );

  // the worst shock of the operation is already paid for; a Full Refresh
  // ends the operation
  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await actorSheet.getByRole("button", { name: "Full Refresh" }).click();
  await page
    .locator(".application.dialog")
    .getByRole("button", { name: "Refresh" })
    .click();
  await expect
    .poll(
      async () =>
        (await getActorSystem(page, actorId)).unnaturalShockSanityLoss,
    )
    .toBe(0);
});
