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
    hideTestDifficulty: false,
    defaultTestDifficulty: 4,
  });
  const { actorId, player, sheet } = await setUpPlayerTest(
    page,
    joinAs,
    "Asker",
  );
  // the player could pick it, but leaves it to the GM
  const picker = sheet.getByTestId("test-difficulty-picker");
  await expect(picker).toHaveValue("4");
  await picker.selectOption({ label: "Ask the GM" });
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
  // back to the default for the next test
  await expect(picker).toHaveValue("4");
});

test("a hidden Difficulty: players see only how it went", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, {
    hideTestDifficulty: true,
    defaultTestDifficulty: null,
  });
  const { player, sheet } = await setUpPlayerTest(page, joinAs, "Hider");
  // asking the GM is the default
  await expect(sheet.getByTestId("test-difficulty-picker")).toHaveValue("ask");
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
    hideTestDifficulty: false,
    defaultTestDifficulty: null,
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

test("the GM can't ask themselves: their tests start at 4 and roll straight away", async ({
  page,
}) => {
  await setSettings(page, {
    hideTestDifficulty: true,
    defaultTestDifficulty: null,
  });
  const actorId = await createActor(page, { name: "Bystander", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const sheet = await openAbilitySheet(page, actorId, "Athletics");
  const picker = sheet.getByTestId("test-difficulty-picker");
  // asking is the default, but not for the GM
  await expect(picker).toHaveValue("4");
  await expect(picker.locator('option[value="ask"]')).toHaveCount(0);
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

  // nor from a quick test, which takes the default
  await page.evaluate(async (actorId) => {
    const ability = game.actors.get(actorId)!.items.getName("Athletics")!;
    await (
      ability.system as unknown as { testAbility: (spend: number) => unknown }
    ).testAbility(0);
  }, actorId);
  await expect(
    lastChatMessage(page).getByTestId("test-difficulty-input"),
  ).toHaveValue("4");
  await expect(page.locator(".application.dialog")).toHaveCount(0);
});

test("cancelling a request only gives back points its author could have taken", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, {
    hideTestDifficulty: false,
    defaultTestDifficulty: null,
  });
  const { player, sheet } = await setUpPlayerTest(page, joinAs, "Forger");
  const victimId = await createActor(page, { name: "Victim", type: "pc" });
  await updateAbility(page, victimId, "Athletics", { rating: 4, pool: 1 });

  await sheet.getByRole("button", { name: "Test", exact: true }).click();
  const playerCard = lastChatMessage(player);
  await expect(playerCard.getByTestId("test-requested")).toBeVisible();
  // the player wrote the card, so they can change what it says it took
  await player.evaluate(async (victimId) => {
    const message = game.messages.contents.at(-1)!;
    const ability = game.actors.get(victimId)!.items.getName("Athletics")!;
    await message.update({
      system: { abilityUuid: ability.uuid, spend: 3 },
    });
  }, victimId);
  await lastChatMessage(player)
    .getByRole("button", { name: "Cancel test" })
    .click();
  await expect(
    lastChatMessage(player).getByTestId("test-cancelled"),
  ).toBeVisible();
  // the refund would follow the cancellation: give it time to go wrong
  await page.waitForTimeout(1000);
  expect(await getPool(page, victimId)).toBe(1);
});

test("a blind request goes to the GM, who rolls it blind", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, {
    hideTestDifficulty: false,
    defaultTestDifficulty: null,
  });
  const { player, sheet } = await setUpPlayerTest(page, joinAs, "Mole");
  await player.evaluate(() =>
    game.settings.set("core", "messageMode", "blind"),
  );
  const dialog = page.locator(".application.dialog", {
    hasText: "Mole is testing Athletics.",
  });

  await sheet.getByRole("button", { name: "Test", exact: true }).click();
  // whoever asked can still see it, so they could withdraw it
  await expect(
    lastChatMessage(player).getByRole("button", { name: "Cancel test" }),
  ).toBeVisible();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Roll", exact: true }).click();
  await expect(lastChatMessage(page).getByTestId("test-outcome")).toBeVisible();
  await expect
    .poll(() => player.evaluate(() => game.messages.contents.at(-1)!.blind))
    .toBe(true);
  await expect(lastChatMessage(player).getByTestId("test-outcome")).toHaveCount(
    0,
  );
  await player.evaluate(() =>
    game.settings.set("core", "messageMode", "public"),
  );
});
