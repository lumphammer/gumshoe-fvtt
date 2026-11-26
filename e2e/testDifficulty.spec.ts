import type { Page } from "@playwright/test";

import {
  createActor,
  createPlayer,
  expect,
  forceDice,
  giveOwnership,
  lastChatMessage,
  openSheet,
  setSettings,
  test,
  updateAbility,
} from "./foundry.ts";
import { stabilityRulesOn } from "./stabilitySettings.ts";

async function openAbilitySheet(page: Page, actorId: string, name: string) {
  const id = await page.evaluate(
    ({ actorId, name }) => game.actors.get(actorId)!.items.getName(name)!.id,
    { actorId, name },
  );
  return openSheet(page, `Actor.${actorId}.Item.${id}`);
}

test("an open Difficulty is picked on the sheet, and the card says how it went", async ({
  page,
}) => {
  await setSettings(page, {
    askGMForTestDifficulty: false,
    defaultTestDifficulty: 4,
  });
  const actorId = await createActor(page, { name: "Sprinter", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const sheet = await openAbilitySheet(page, actorId, "Athletics");
  const test = sheet.getByRole("button", { name: "Test", exact: true });

  await forceDice(page, 6);
  await test.click();
  // the GM can change it on the card
  let card = lastChatMessage(page);
  await expect(card.getByTestId("test-difficulty-input")).toHaveValue("4");
  await expect(card.getByTestId("test-outcome")).toHaveText("Successful 6!");

  // a 6 that falls short isn't a successful 6
  await sheet.getByTestId("test-difficulty-picker").selectOption("8");
  await test.click();
  card = lastChatMessage(page);
  await expect(card.getByTestId("test-difficulty-input")).toHaveValue("8");
  await expect(card.getByTestId("test-outcome")).toHaveText("Failure");
  // back to the default for the next test
  await expect(sheet.getByTestId("test-difficulty-picker")).toHaveValue("4");

  await forceDice(page, 1);
  await test.click();
  await expect(lastChatMessage(page).getByTestId("test-outcome")).toHaveText(
    "Failed 1",
  );
});

test("Shaken adds to the Difficulty of a General test", async ({ page }) => {
  await setSettings(page, {
    ...stabilityRulesOn,
    useStabilityStates: true,
    askGMForTestDifficulty: false,
    defaultTestDifficulty: 4,
  });
  const actorId = await createActor(page, { name: "Jumpy", type: "pc" });
  await updateAbility(page, actorId, "Stability", { rating: 6, pool: -1 });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const sheet = await openAbilitySheet(page, actorId, "Athletics");

  await forceDice(page, 4);
  await sheet.getByRole("button", { name: "Test", exact: true }).click();
  const card = lastChatMessage(page);
  await expect(card.getByTestId("test-difficulty-input")).toHaveValue("4");
  await expect(card.getByTestId("test-difficulty")).toHaveText(
    "Difficulty Shaken +1 = 5",
  );
  await expect(card.getByTestId("test-outcome")).toHaveText("Failure");
});

/** A PC owned by a new player, who's joined */
async function setUpPlayerTest(
  page: Page,
  joinAs: (userName: string) => Promise<Page>,
  name: string,
) {
  const actorId = await createActor(page, { name, type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const playerId = await createPlayer(page, `${name}'s player`);
  await giveOwnership(page, actorId, playerId);
  const player = await joinAs(`${name}'s player`);
  const sheet = await openAbilitySheet(player, actorId, "Athletics");
  return { actorId, player, sheet };
}

async function getPool(page: Page, actorId: string) {
  return page.evaluate(
    (actorId) =>
      game.actors.get(actorId)!.items.getName("Athletics")!.system
        .pool as number,
    actorId,
  );
}

test("a player's test asks the GM for the Difficulty before it's rolled", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, {
    askGMForTestDifficulty: true,
    hideTestDifficulty: false,
    defaultTestDifficulty: 4,
  });
  const { actorId, player, sheet } = await setUpPlayerTest(
    page,
    joinAs,
    "Asker",
  );
  // the GM picks it
  await expect(sheet.getByTestId("test-difficulty-picker")).toHaveCount(0);
  await sheet.locator("label", { hasText: /^1$/ }).click();
  await sheet.getByRole("button", { name: "Test", exact: true }).click();

  // the points are spent straight away; nothing's rolled yet
  await expect.poll(() => getPool(page, actorId)).toBe(3);
  const playerCard = lastChatMessage(player);
  await expect(playerCard.getByTestId("test-requested")).toBeVisible();
  await expect(playerCard.getByTestId("test-spend")).toHaveText("Spent 1");
  await expect(playerCard.locator(".dice-total")).toHaveCount(0);
  await expect(
    playerCard.getByRole("button", { name: "Roll", exact: true }),
  ).toHaveCount(0);

  // the GM's asked
  const dialog = page.locator(".application.dialog", {
    hasText: "Asker is testing Athletics.",
  });
  await expect(dialog).toContainText("Athletics 1");
  await expect(dialog.getByRole("combobox")).toHaveValue("4");
  await dialog.getByRole("combobox").selectOption("5");
  await forceDice(page, 4);
  await dialog.getByRole("button", { name: "Roll", exact: true }).click();
  await expect(dialog).toHaveCount(0);

  await expect(playerCard.locator(".dice-total")).toHaveText("5");
  await expect(playerCard.getByTestId("test-difficulty")).toHaveText(
    "Difficulty 5",
  );
  await expect(playerCard.getByTestId("test-outcome")).toHaveText("Success");
  await expect(playerCard.getByTestId("test-requested")).toHaveCount(0);
});

test("a hidden Difficulty: players see only how it went", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, {
    askGMForTestDifficulty: true,
    hideTestDifficulty: true,
    defaultTestDifficulty: 4,
  });
  const { player, sheet } = await setUpPlayerTest(page, joinAs, "Hider");
  await sheet.getByRole("button", { name: "Test", exact: true }).click();

  // answered from the card, which closes the prompt
  const dialog = page.locator(".application.dialog", {
    hasText: "Hider is testing Athletics.",
  });
  await expect(dialog).toBeVisible();
  const gmCard = lastChatMessage(page);
  await gmCard.getByTestId("test-request-difficulty").selectOption("3");
  await forceDice(page, 2);
  await gmCard.getByRole("button", { name: "Roll", exact: true }).click();
  await expect(dialog).toHaveCount(0);

  const playerCard = lastChatMessage(player);
  await expect(playerCard.getByTestId("test-outcome")).toHaveText("Failure");
  await expect(playerCard.getByTestId("test-difficulty")).toHaveCount(0);
  // the GM still sees it, and can change it
  const input = lastChatMessage(page).getByTestId("test-difficulty-input");
  await expect(input).toHaveValue("3");
  await input.fill("2");
  await input.press("Enter");
  await expect(playerCard.getByTestId("test-outcome")).toHaveText("Success");
});

test("a player can withdraw a request, or roll it without a Difficulty", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, {
    askGMForTestDifficulty: true,
    hideTestDifficulty: false,
    defaultTestDifficulty: 4,
  });
  const { actorId, player, sheet } = await setUpPlayerTest(
    page,
    joinAs,
    "Waverer",
  );
  const dialog = page.locator(".application.dialog", {
    hasText: "Waverer is testing Athletics.",
  });

  await sheet.locator("label", { hasText: /^2$/ }).click();
  await sheet.getByRole("button", { name: "Test", exact: true }).click();
  await expect.poll(() => getPool(page, actorId)).toBe(2);
  await expect(dialog).toBeVisible();
  let playerCard = lastChatMessage(player);
  await playerCard.getByRole("button", { name: "Cancel test" }).click();
  await expect(playerCard.getByTestId("test-cancelled")).toBeVisible();
  await expect.poll(() => getPool(page, actorId)).toBe(4);
  await expect(dialog).toHaveCount(0);

  await sheet.getByRole("button", { name: "Test", exact: true }).click();
  await expect(dialog).toBeVisible();
  playerCard = lastChatMessage(player);
  // the GM's client rolls it
  await forceDice(page, 3);
  await playerCard
    .getByRole("button", { name: "Roll without a Difficulty" })
    .click();
  await expect(playerCard.locator(".dice-total")).toHaveText("3");
  await expect(playerCard.getByTestId("test-no-difficulty")).toHaveText(
    "No Difficulty",
  );
  await expect(playerCard.getByTestId("test-outcome")).toHaveCount(0);
  await expect(dialog).toHaveCount(0);
});

test("the GM's own tests roll straight away", async ({ page }) => {
  await setSettings(page, {
    askGMForTestDifficulty: true,
    hideTestDifficulty: true,
    defaultTestDifficulty: 4,
  });
  const actorId = await createActor(page, { name: "Bystander", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const sheet = await openAbilitySheet(page, actorId, "Athletics");
  const picker = sheet.getByTestId("test-difficulty-picker");
  // 0 and 1 can't be failed
  await expect(
    picker.locator('option[value="0"], option[value="1"]'),
  ).toHaveCount(0);
  await picker.selectOption("6");
  await forceDice(page, 5);
  await sheet.getByRole("button", { name: "Test", exact: true }).click();

  const card = lastChatMessage(page);
  await expect(card.getByTestId("test-difficulty-input")).toHaveValue("6");
  await expect(card.getByTestId("test-outcome")).toHaveText("Failure");
  await expect(page.locator(".application.dialog")).toHaveCount(0);
});
