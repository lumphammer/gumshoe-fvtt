import { expect, test } from "./foundry.ts";

test("testing a general ability spends from its pool and rolls", async ({
  page,
}) => {
  const actorId = await page.evaluate(async () => {
    const actor = await Actor.create({ name: "Test Investigator", type: "pc" });
    return actor!.id;
  });
  // the system gives new investigators their abilities just after creation
  await expect
    .poll(() =>
      page.evaluate(
        (id) => !!game.actors.get(id)?.items.getName("Athletics"),
        actorId,
      ),
    )
    .toBe(true);
  await page.evaluate(async (id) => {
    const actor = game.actors.get(id)!;
    await actor.items
      .getName("Athletics")!
      .update({ system: { rating: 4, pool: 4 } });
    // every d6 rolls a 6
    CONFIG.Dice.randomUniform = () => 0.01;
    // our sheets are all ApplicationV2
    const sheet = actor.sheet as foundry.applications.api.ApplicationV2;
    await sheet.render({ force: true });
  }, actorId);

  const actorSheet = page.locator(".application", {
    hasText: "Player Character: Test Investigator",
  });
  await actorSheet.locator("a", { hasText: /^Athletics$/ }).click();

  const abilitySheet = page.locator(".application", {
    hasText: "General Ability: Athletics",
  });
  await abilitySheet.locator("label", { hasText: /^2$/ }).click();
  await abilitySheet.getByRole("button", { name: "Test" }).click();

  const card = page.locator("#chat .chat-message").last();
  await expect(card).toContainText("Athletics");
  await expect(card.locator(".dice-total")).toHaveText("8");
  await expect(abilitySheet.getByLabel("Pool", { exact: true })).toHaveValue(
    "2",
  );
});
