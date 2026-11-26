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
    secretTestDifficulty: false,
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
    secretTestDifficulty: false,
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

test("a secret Difficulty is the GM's to change and reveal", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, {
    secretTestDifficulty: true,
    defaultTestDifficulty: 4,
  });
  const actorId = await createActor(page, { name: "Sneak", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const playerId = await createPlayer(page, "Secret Keeper");
  await giveOwnership(page, actorId, playerId);

  const player = await joinAs("Secret Keeper");
  const sheet = await openAbilitySheet(player, actorId, "Athletics");
  // players don't pick a secret Difficulty
  await expect(sheet.getByTestId("test-difficulty-picker")).toHaveCount(0);
  await forceDice(player, 3);
  await sheet.getByRole("button", { name: "Test", exact: true }).click();

  const playerCard = lastChatMessage(player);
  await expect(playerCard.locator(".dice-total")).toHaveText("3");
  await expect(playerCard.getByTestId("test-difficulty-secret")).toHaveText(
    "Difficulty: secret",
  );
  await expect(playerCard.getByTestId("test-outcome")).toHaveCount(0);

  // the GM sees it, and makes it easier
  const gmCard = lastChatMessage(page);
  await expect(gmCard.getByTestId("test-outcome")).toHaveText("Failure");
  const input = gmCard.getByTestId("test-difficulty-input");
  await input.fill("3");
  await input.press("Enter");
  await expect(gmCard.getByTestId("test-outcome")).toHaveText("Success");
  await expect(playerCard.getByTestId("test-outcome")).toHaveCount(0);

  await gmCard.getByRole("button", { name: "Reveal to players" }).click();
  await expect(playerCard.getByTestId("test-difficulty")).toHaveText(
    "Difficulty 3",
  );
  await expect(playerCard.getByTestId("test-outcome")).toHaveText("Success");
  await expect(playerCard.getByRole("button", { name: /players/ })).toHaveCount(
    0,
  );

  await lastChatMessage(page)
    .getByRole("button", { name: "Hide from players" })
    .click();
  await expect(playerCard.getByTestId("test-difficulty-secret")).toBeVisible();
});

test("an open test can leave its Difficulty for the GM to set", async ({
  page,
  joinAs,
}) => {
  await setSettings(page, {
    secretTestDifficulty: false,
    defaultTestDifficulty: 4,
  });
  const actorId = await createActor(page, { name: "Hopeful", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const playerId = await createPlayer(page, "Waiter");
  await giveOwnership(page, actorId, playerId);

  const player = await joinAs("Waiter");
  const sheet = await openAbilitySheet(player, actorId, "Athletics");
  await sheet
    .getByTestId("test-difficulty-picker")
    .selectOption({ label: "Let the GM set it" });
  await forceDice(player, 3);
  await sheet.getByRole("button", { name: "Test", exact: true }).click();

  const playerCard = lastChatMessage(player);
  await expect(playerCard.locator(".dice-total")).toHaveText("3");
  await expect(playerCard.getByTestId("test-difficulty-awaited")).toHaveText(
    "Waiting for the GM to set the Difficulty",
  );
  await expect(playerCard.getByTestId("test-outcome")).toHaveCount(0);

  const gmCard = lastChatMessage(page);
  const input = gmCard.getByTestId("test-difficulty-input");
  await expect(input).toHaveValue("");
  await expect(gmCard.getByTestId("test-outcome")).toHaveCount(0);
  await input.fill("3");
  await input.press("Enter");

  // open, so the player sees it as soon as it's set
  await expect(playerCard.getByTestId("test-difficulty")).toHaveText(
    "Difficulty 3",
  );
  await expect(playerCard.getByTestId("test-outcome")).toHaveText("Success");
});

test("the default can leave every Difficulty for the GM", async ({ page }) => {
  await setSettings(page, {
    secretTestDifficulty: false,
    defaultTestDifficulty: null,
  });
  const actorId = await createActor(page, { name: "Patient", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  const sheet = await openAbilitySheet(page, actorId, "Athletics");
  const picker = sheet.getByTestId("test-difficulty-picker");
  await expect(picker).toHaveValue("unset");
  // they can't be failed
  await expect(
    picker.locator('option[value="0"], option[value="1"]'),
  ).toHaveCount(0);

  await forceDice(page, 6);
  await sheet.getByRole("button", { name: "Test", exact: true }).click();
  const card = lastChatMessage(page);
  await expect(card.getByTestId("test-difficulty-input")).toHaveValue("");
  await expect(card.getByTestId("test-outcome")).toHaveCount(0);
});
