import {
  createActor,
  expect,
  forceDice,
  lastChatMessage,
  openSheet,
  test,
  updateAbility,
} from "./foundry.ts";

test("testing a general ability spends from its pool and rolls", async ({
  page,
}) => {
  const actorId = await createActor(page, {
    name: "Test Investigator",
    type: "pc",
  });
  await updateAbility(page, actorId, "Athletics", { rating: 4, pool: 4 });
  await forceDice(page, 6);

  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await actorSheet.locator("a", { hasText: /^Athletics$/ }).click();

  const abilitySheet = page.locator(".application", {
    hasText: "General Ability: Athletics",
  });
  await abilitySheet.locator("label", { hasText: /^2$/ }).click();
  await abilitySheet.getByRole("button", { name: "Test" }).click();

  const card = lastChatMessage(page);
  await expect(card).toContainText("Athletics");
  await expect(card.locator(".dice-total")).toHaveText("8");
  await expect(abilitySheet.getByLabel("Pool", { exact: true })).toHaveValue(
    "2",
  );
});
