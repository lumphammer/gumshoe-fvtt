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

test("the header and stats panel follow the name, notes and details changed elsewhere", async ({
  page,
}) => {
  await setSettings(page, {
    personalDetails: [
      { name: "Alias", type: "text" },
      { name: "Drive", type: "item" },
    ],
  });
  const actorId = await createActor(page, { name: "Before", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  // the name is the title's: the stats panel has no field for it
  const title = sheet.getByRole("textbox", { name: "Name (title)" });
  await expect(title).toHaveText("Before");
  await expect(sheet.getByLabel("Name", { exact: true })).toHaveCount(0);
  const alias = sheet.getByLabel("Alias", { exact: true });
  await expect(alias).toHaveValue("");

  await page.evaluate(async (actorId) => {
    await game.actors.get(actorId)!.update({
      name: "After",
      system: { shortNotes: ["The Professor"] },
    });
  }, actorId);
  await expect(title).toHaveText("After");
  await expect(alias).toHaveValue("The Professor");

  const driveField = sheet
    .locator("label", { hasText: /^Drive$/ })
    .locator("xpath=following-sibling::div[1]");
  await expect(driveField).toContainText("Create");
  await createOwnedItem(page, actorId, {
    name: "Curiosity",
    type: "personalDetail",
    system: { slotIndex: 1 },
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

test("the occupation is a button in the title, which opens its sheet, or makes one", async ({
  page,
}) => {
  const actorId = await createActor(page, { name: "Armitage", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  // the stats panel has no field for it
  await expect(sheet.locator("label", { hasText: /^Occupation$/ })).toHaveCount(
    0,
  );
  // named for what it is, as well as what it says
  const occupation = sheet.getByRole("button", {
    name: "Occupation: Investigator",
  });
  const occupationId = await page.evaluate(
    (id) =>
      game.actors.get(id)!.items.find((i) => i.type === "personalDetail")!.id,
    actorId,
  );

  // a tint when hovered, as for the name (logoStates)
  const tint = (locator: typeof occupation) =>
    locator.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(await tint(occupation)).toBe("none");
  await occupation.hover();
  await expect.poll(() => tint(occupation)).toContain("inset");
  const title = sheet.getByRole("textbox", { name: "Name (title)" });
  await title.hover();
  await expect.poll(() => tint(title)).toContain("inset");

  await occupation.click();
  await expect
    .poll(() =>
      page.evaluate(
        ([actorId, itemId]) =>
          game.actors.get(actorId)!.items.get(itemId)!.sheet!.rendered,
        [actorId, occupationId] as const,
      ),
    )
    .toBe(true);
  await page.evaluate(
    ([actorId, itemId]) =>
      game.actors.get(actorId)!.items.get(itemId)!.sheet!.close(),
    [actorId, occupationId] as const,
  );

  // with none, clicking it makes one
  await page.evaluate(
    async ([actorId, itemId]) => {
      await game.actors.get(actorId)!.items.get(itemId)!.delete();
    },
    [actorId, occupationId] as const,
  );
  await occupation.click();
  await expect
    .poll(() =>
      page.evaluate(
        (id) =>
          game.actors.get(id)!.items.filter((i) => i.type === "personalDetail")
            .length,
        actorId,
      ),
    )
    .toBe(1);
});

test("with no personal details, hidden notes or stats in it, the stats region isn't drawn", async ({
  page,
}) => {
  await setSettings(page, {
    personalDetails: [],
    mwHiddenShortNotes: [],
    pcStats: {
      hitThreshold: { name: "Hit threshold", default: 3, placement: "combat" },
    },
  });
  const actorId = await createActor(page, { name: "Bare", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const region = sheet.locator(".grid-area_stats");
  await expect(region).toHaveCount(0);

  // any one of them brings it back: a stat in the header...
  await setSettings(page, {
    pcStats: { sanity: { name: "Sanity", default: 10 } },
  });
  await expect(region).toBeVisible();
  // ...a hidden note, for the GM...
  await setSettings(page, {
    pcStats: {},
    mwHiddenShortNotes: ["Secret"],
  });
  await expect(region).toBeVisible();
  await setSettings(page, { mwHiddenShortNotes: [] });
  await expect(region).toHaveCount(0);
  // ...or a personal detail
  await setSettings(page, {
    personalDetails: [{ name: "Alias", type: "text" }],
  });
  await expect(region).toBeVisible();
});

test("several occupations are each a button in the title, opening only its own sheet", async ({
  page,
}) => {
  await setSettings(page, {
    personalDetails: [{ name: "Drive", type: "item" }],
  });
  const actorId = await createActor(page, { name: "Wilmarth", type: "pc" });
  // moved into the occupation slot (adding one there asks what to do)
  const folkloristId = await createOwnedItem(page, actorId, {
    name: "Folklorist",
    type: "personalDetail",
    system: { slotIndex: 0 },
  });
  await page.evaluate(
    async ([actorId, itemId]) => {
      await game.actors
        .get(actorId)!
        .items.get(itemId)!
        .update({ system: { slotIndex: -1 } });
    },
    [actorId, folkloristId] as const,
  );
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await expect(
    sheet.getByRole("button", { name: "Occupation: Investigator" }),
  ).toBeVisible();
  const folklorist = sheet.getByRole("button", {
    name: "Occupation: Folklorist",
  });
  // each can be dragged to another sheet, as the item it is
  await expect(folklorist).toHaveAttribute("draggable", "true");
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await folklorist.dispatchEvent("dragstart", { dataTransfer });
  expect(
    JSON.parse(
      await dataTransfer.evaluate((data) => data.getData("text/plain")),
    ),
  ).toMatchObject({
    type: "Item",
    uuid: `Actor.${actorId}.Item.${folkloristId}`,
  });

  await folklorist.click();
  const openOccupations = () =>
    page.evaluate(
      (id) =>
        game.actors
          .get(id)!
          .items.filter((i) => i.type === "personalDetail" && i.sheet!.rendered)
          .map((i) => i.name),
      actorId,
    );
  await expect.poll(openOccupations).toEqual(["Folklorist"]);
});

test("with no occupation and a blank generic one, the title says what it's for", async ({
  page,
}) => {
  await setSettings(page, { genericOccupation: "" });
  const actorId = await createActor(page, { name: "Peaslee", type: "pc" });
  // the one a new PC gets is named for the slot, too
  expect(
    await page.evaluate(
      (id) =>
        game.actors.get(id)!.items.find((i) => i.type === "personalDetail")!
          .name,
      actorId,
    ),
  ).toBe("Occupation");
  await page.evaluate(async (id) => {
    const actor = game.actors.get(id)!;
    await actor.deleteEmbeddedDocuments(
      "Item",
      actor.items.filter((i) => i.type === "personalDetail").map((i) => i.id),
    );
  }, actorId);
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await expect(
    sheet.getByRole("button", { name: "Occupation: Occupation" }),
  ).toHaveText("Occupation");
});
