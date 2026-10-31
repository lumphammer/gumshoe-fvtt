import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
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

test("the pools panel follows pools and the initiative ability changed elsewhere", async ({
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
  const before = await selected(3).getAttribute("class");

  await updateAbility(page, actorId, "Athletics", { pool: 1 });
  // the selected box is styled differently: 3 loses that, 1 gains it
  await expect.poll(() => selected(1).getAttribute("class")).toBe(before);
  await expect.poll(() => selected(3).getAttribute("class")).not.toBe(before);

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
