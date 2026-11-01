import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  setSettings,
  test,
  visitEveryTab,
} from "./foundry.ts";

test("with cards on, a PC's cards and card sheets render", async ({ page }) => {
  await setSettings(page, {
    useCards: true,
    cardCategories: [
      {
        id: "stress",
        singleName: "Stress",
        pluralName: "Stresses",
        styleKey: "stress",
        threshold: 3,
        thresholdType: "limit",
      },
    ],
  });
  const actorId = await createActor(page, { name: "Card Holder", type: "pc" });
  const cardId = await createOwnedItem(page, actorId, {
    name: "Shaken",
    type: "card",
    system: {
      title: "Shaken",
      cardCategoryMemberships: [
        { categoryId: "stress", nonlethal: false, worth: 1 },
      ],
      styleKeyCategoryId: "stress",
    },
  });

  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await actorSheet.locator(".tab-strip > label", { hasText: "Cards" }).click();
  await expect(actorSheet).toContainText("Shaken");
  await visitEveryTab(actorSheet);
  await visitEveryTab(await openSheet(page, `Actor.${actorId}.Item.${cardId}`));
});

test("the Cards tab follows cards changed elsewhere", async ({ page }) => {
  await setSettings(page, {
    useCards: true,
    cardCategories: [
      {
        id: "stress",
        singleName: "Stress",
        pluralName: "Stresses",
        styleKey: "stress",
        threshold: 3,
        thresholdType: "limit",
      },
    ],
  });
  const actorId = await createActor(page, { name: "Dealer", type: "pc" });
  const cardId = await createOwnedItem(page, actorId, {
    name: "Rattled",
    type: "card",
    system: { subtitle: "A bit" },
  });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await sheet.locator(".tab-strip > label", { hasText: "Cards" }).click();
  await expect(sheet).toContainText("Rattled");
  // (a new card starts in the first category)
  await expect(sheet).toContainText("1/3 Stresses");

  // renamed, and made worth 2, elsewhere
  await page.evaluate(
    async ({ actorId, cardId }) => {
      await game.actors
        .get(actorId)!
        .items.get(cardId)!
        .update({
          name: "Shaken",
          system: {
            subtitle: "Very",
            cardCategoryMemberships: [
              { categoryId: "stress", nonlethal: false, worth: 2 },
            ],
          },
        });
    },
    { actorId, cardId },
  );
  await expect(sheet).toContainText("Shaken");
  await expect(sheet).toContainText("Very");
  await expect(sheet).toContainText("Stress (2)");
  // the category's count follows its worth
  await expect(sheet).toContainText("2/3 Stresses");

  // added elsewhere
  await createOwnedItem(page, actorId, { name: "Calm", type: "card" });
  await expect(sheet).toContainText("Calm");
});
