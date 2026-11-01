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

test("cards follow their category being renamed", async ({ page }) => {
  const stress = {
    id: "stress",
    singleName: "Stress",
    pluralName: "Stresses",
    styleKey: "stress",
    threshold: 3,
    thresholdType: "limit",
  };
  await setSettings(page, { useCards: true, cardCategories: [stress] });
  const actorId = await createActor(page, { name: "Dealer", type: "pc" });
  const cardId = await createOwnedItem(page, actorId, {
    name: "Rattled",
    type: "card",
    system: {
      cardCategoryMemberships: [
        { categoryId: "stress", nonlethal: false, worth: 1 },
      ],
      styleKeyCategoryId: "stress",
    },
  });
  const actorSheet = await openSheet(page, `Actor.${actorId}`);
  await actorSheet.locator(".tab-strip > label", { hasText: "Cards" }).click();
  const cardSheet = await openSheet(page, `Actor.${actorId}.Item.${cardId}`);
  const supertitles = page.locator(".investigator-card-display .supertitle");
  await expect(supertitles).toHaveText(["Stress", "Stress"]);

  // the card reads its categories through a snapshot: an unconverted sheet
  // (the card's own) isn't re-rendered by a settings change
  await setSettings(page, {
    cardCategories: [{ ...stress, singleName: "Strain" }],
  });
  await expect(
    actorSheet.locator(".investigator-card-display .supertitle"),
  ).toHaveText("Strain");
  await expect(
    cardSheet.locator(".investigator-card-display .supertitle"),
  ).toHaveText("Strain");
});

test("the Cards tab re-sorts and regroups cards changed elsewhere", async ({
  page,
}) => {
  const stress = {
    id: "stress",
    singleName: "Stress",
    pluralName: "Stresses",
    styleKey: "stress",
    threshold: 3,
    thresholdType: "limit",
  };
  const injury = {
    id: "injury",
    singleName: "Injury",
    pluralName: "Injuries",
    styleKey: "injury",
    threshold: 2,
    thresholdType: "limit",
  };
  await setSettings(page, { useCards: true, cardCategories: [stress, injury] });
  const actorId = await createActor(page, {
    name: "Sorter",
    type: "pc",
    system: {
      // one column, so the cards are in order on the page
      cardsAreaSettings: {
        category: "categorized",
        sortOrder: "atoz",
        columnWidth: "full",
        viewMode: "short",
      },
    },
  });
  const inStress = {
    cardCategoryMemberships: [
      { categoryId: "stress", nonlethal: false, worth: 1 },
    ],
  };
  const bravoId = await createOwnedItem(page, actorId, {
    name: "Bravo",
    type: "card",
    system: inStress,
  });
  const deltaId = await createOwnedItem(page, actorId, {
    name: "Delta",
    type: "card",
    system: inStress,
  });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await sheet.locator(".tab-strip > label", { hasText: "Cards" }).click();
  // the categories' headings, in the list of cards
  const headings = sheet.locator(".container-ref-haver > h2");
  const titles = sheet.locator(".investigator-card-display .title");
  await expect(headings).toHaveText(["Stresses (2/3)", "Injuries (0/2)"]);
  await expect(titles).toHaveText(["Bravo", "Delta"]);

  const updateCard = (id: string, data: object) =>
    page.evaluate(
      async ({ actorId, id, data }) => {
        await game.actors.get(actorId)!.items.get(id)!.update(data);
      },
      { actorId, id, data },
    );

  // renamed elsewhere: sorted again
  await updateCard(deltaId, { name: "Alpha" });
  await expect(titles).toHaveText(["Alpha", "Bravo"]);

  // moved to another category elsewhere: grouped and counted again
  await updateCard(bravoId, {
    system: {
      cardCategoryMemberships: [
        { categoryId: "injury", nonlethal: false, worth: 1 },
      ],
    },
  });
  await expect(headings).toHaveText(["Stresses (1/3)", "Injuries (1/2)"]);
  await expect(titles).toHaveText(["Alpha", "Bravo"]);

  // a category renamed: its heading follows
  await setSettings(page, {
    cardCategories: [stress, { ...injury, pluralName: "Wounds" }],
  });
  await expect(headings).toHaveText(["Stresses (1/3)", "Wounds (1/2)"]);
});
