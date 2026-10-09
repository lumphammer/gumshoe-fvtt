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
