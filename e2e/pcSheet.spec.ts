import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  setSettings,
  test,
  updateAbility,
} from "./foundry.ts";

// The PC sheet's header, stats panel and pools panel are memoised, and read
// the actor through snapshots: these check that changes made elsewhere still
// reach them.

test("the stats panel follows the name, notes and details changed elsewhere", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Before", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const personName = sheet
    .locator("label", { hasText: /^Name$/ })
    .locator("xpath=following-sibling::div[1]")
    .locator("input");
  await expect(personName).toHaveValue("Before");

  await page.evaluate(async (actorId) => {
    await game.actors.get(actorId)!.update({ name: "After" });
  }, actorId);
  await expect(personName).toHaveValue("After");

  const driveField = sheet
    .locator("label", { hasText: /^Drive$/ })
    .locator("xpath=following-sibling::div[1]");
  await expect(driveField).toContainText("Create");
  await createOwnedItem(page, actorId, {
    name: "Curiosity",
    type: "personalDetail",
    system: { slotIndex: 0 },
  });
  await expect(driveField).toContainText("Curiosity");
});

test("the pools panel and combat tab follow pools and the initiative ability changed elsewhere", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Tracked", type: "pc" });
  await updateAbility(page, actorId, "Athletics", {
    rating: 3,
    pool: 3,
    showTracker: true,
  });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const tracker = sheet
    .getByTestId("pool-tracker")
    .filter({ hasText: "Athletics" });
  const selected = (value: number) =>
    tracker.locator("a", { hasText: new RegExp(`^${value}$`) });
  await expect(tracker).toBeVisible();
  await expect(selected(3)).toHaveAttribute("data-pressed", "true");

  await updateAbility(page, actorId, "Athletics", { pool: 1 });
  // the selected box is pressed: 3 loses that, 1 gains it
  await expect(selected(1)).toHaveAttribute("data-pressed", "true");
  await expect(selected(3)).not.toHaveAttribute("data-pressed");

  await updateAbility(page, actorId, "Athletics", { showTracker: false });
  await expect(tracker).toHaveCount(0);

  // whichever of these it isn't already
  const initiative = await page.evaluate(async (actorId) => {
    const actor = game.actors.get(actorId)!;
    const current = (actor.system as unknown as { initiativeAbility: string })
      .initiativeAbility;
    const next = current === "Scuffling" ? "Athletics" : "Scuffling";
    await actor.update({ system: { initiativeAbility: next } });
    return next;
  }, actorId);
  await sheet.locator(".tab-strip > label", { hasText: "Combat" }).click();
  await expect(
    sheet
      .locator("h3", { hasText: "Initiative" })
      .locator("xpath=following-sibling::*[1]")
      .locator("select"),
  ).toHaveValue(initiative);
});

test("the Notes and Settings tabs follow changes made elsewhere", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Diarist", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const tab = (name: string) =>
    sheet.locator(".tab-strip > label", { hasText: name }).first().click();

  await tab("Notes");
  await page.evaluate(async (actorId) => {
    await game.actors
      .get(actorId)!
      .update({ system: { longNotes: ["<p>Dreams of a sunken city</p>"] } });
  }, actorId);
  await expect(sheet).toContainText("Dreams of a sunken city");

  // the Settings tab is opened from the sheet's header
  await sheet.locator('[data-action="toggleSheetSettings"]').click();
  const themeSelect = sheet
    .locator("label", { hasText: /^Theme$/ })
    .locator("xpath=following-sibling::div[1]")
    .locator("select");
  const otherTheme = await themeSelect.evaluate((select) => {
    const options = [...(select as HTMLSelectElement).options];
    return options.find((option) => !option.selected)!.value;
  });
  await page.evaluate(
    async ({ actorId, otherTheme }) => {
      await game.actors
        .get(actorId)!
        .update({ system: { sheetTheme: otherTheme } });
    },
    { actorId, otherTheme },
  );
  await expect(themeSelect).toHaveValue(otherTheme);
});

test("Moribund World's items tab follows items changed elsewhere", async ({
  page,
}) => {
  await setSettings(page, { mwUseAlternativeItemTypes: true });
  try {
    const actorId = await createActor(page, { name: "Magus", type: "pc" });
    const spellId = await createOwnedItem(page, actorId, {
      name: "Excellent Prismatic Spray",
      type: "mwItem",
      system: { mwType: "spell" },
    });
    const sheet = await openSheet(page, `Actor.${actorId}`);
    await sheet.locator(".tab-strip > label", { hasText: "Items" }).click();
    const spells = sheet
      .locator("h1", { hasText: "Spells" })
      .locator("xpath=../..");
    await expect(spells).toContainText("Excellent Prismatic Spray");

    await page.evaluate(
      async ({ actorId, spellId }) => {
        await game.actors
          .get(actorId)!
          .items.get(spellId)!
          .update({ name: "Phandaal's Gyrator" });
      },
      { actorId, spellId },
    );
    await expect(spells).toContainText("Phandaal's Gyrator");

    await createOwnedItem(page, actorId, {
      name: "Coat of Rigor",
      type: "mwItem",
      system: { mwType: "tweak" },
    });
    await expect(sheet).toContainText("Coat of Rigor");

    // clicking an item opens its sheet
    await sheet.getByText("Phandaal's Gyrator", { exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate(
          ({ actorId, spellId }) =>
            game.actors.get(actorId)!.items.get(spellId)!.sheet!.rendered,
          { actorId, spellId },
        ),
      )
      .toBe(true);
  } finally {
    await setSettings(page, { mwUseAlternativeItemTypes: false });
  }
});

test("open PC and party sheets follow themes installed and replaced at runtime", async ({
  page,
}) => {
  await setSettings(page, { defaultThemeName: "runtimeReviewTheme" });
  const partyId = await createActor(page, {
    name: "Themed party",
    type: "party",
  });
  const pcId = await createActor(page, { name: "Themed PC", type: "pc" });
  const party = await openSheet(page, `Actor.${partyId}`);
  const pc = await openSheet(page, `Actor.${pcId}`);
  await pc.locator('[data-action="toggleSheetSettings"]').click();
  const select = pc
    .locator("label", { hasText: /^Theme$/ })
    .locator("xpath=following-sibling::div[1]")
    .locator("select");
  const option = select.locator('option[value="runtimeReviewTheme"]');
  await expect(option).toHaveCount(0);
  const install = (displayName: string, color: string) =>
    page.evaluate(
      ({ displayName, color }) =>
        CONFIG.Investigator!.installTheme("runtimeReviewTheme", {
          schemaVersion: "v1",
          displayName,
          largeSheetRootStyle: { outlineColor: color },
          smallSheetRootStyle: { outlineColor: color },
          logo: {
            frontTextElementStyle: {},
            rearTextElementStyle: {},
            textElementsStyle: {},
            backdropStyle: {},
          },
          colors: {
            accent: "white",
            accentContrast: "black",
            glow: "white",
            wallpaper: "black",
            text: "white",
            backgroundButton: "black",
            backgroundPrimary: "black",
            backgroundSecondary: "black",
          },
        }),
      { displayName, color },
    );
  for (const [name, color] of [
    ["Installed Theme", "rgb(12, 34, 56)"],
    ["Replaced Theme", "rgb(65, 43, 21)"],
  ]) {
    await install(name, color);
    await expect(option).toHaveText(name);
    await expect(select.locator("option").last()).toContainText(
      `Default (${name})`,
    );
    for (const sheet of [pc, party]) {
      await expect(sheet.locator(".window-content > div")).toHaveCSS(
        "outline-color",
        color,
      );
    }
  }
});
