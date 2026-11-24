import type { Locator, Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  createPlayer,
  giveOwnership,
  createSceneWithTokens,
  expect,
  lastChatMessage,
  openSheet,
  test,
} from "./foundry.ts";

// Foundry takes Tab (cycling tokens) and Space (pause) unless the focused
// element is a text input, a button in a form, or says it takes keys itself
// (`data-keyboard-focus`). Everything we make focusable has to, or the
// keyboard gets stuck on it. Foundry only takes Tab with a scene on the
// canvas, as in play.
test.use({ canvas: true });

async function pcSheet(page: Page, name: string) {
  const actorId = await createActor(page, { name, type: "pc" });
  await createSceneWithTokens(page, [actorId]);
  const sheet = await openSheet(page, `Actor.${actorId}`);
  return { actorId, sheet };
}

function paused(page: Page) {
  return page.evaluate(() => game.paused);
}

test("Tab moves on through a PC sheet, and reaches its links", async ({
  page,
}) => {
  // a hundred or so presses, with the canvas on
  test.slow();
  const { sheet } = await pcSheet(page, "Tabbed Through");
  const content = sheet.locator(".window-content");
  await content.getByRole("textbox").first().focus();

  const reached: string[] = [];
  // until it leaves the sheet's content: one call to the page per press, as
  // there are a lot of them
  for (let i = 0; i < 200; i++) {
    await page.keyboard.press("Tab");
    const stop = await content.evaluate((content) => {
      const element = document.activeElement as HTMLElement;
      const store = window as { lastFocused?: Element };
      const moved = element !== store.lastFocused;
      store.lastFocused = element;
      if (!content.contains(element)) {
        return { inSheet: false, moved, role: "" };
      }
      const role = element.closest("[data-testid=pool-tracker] h2")
        ? "tracker"
        : element.matches("[data-testid=pool-tracker] [role=radio]")
          ? "pip"
          : element.matches(".tab-strip > label")
            ? "tab"
            : element.matches(".inv-default-ability-name-link")
              ? "ability"
              : "other";
      return { inSheet: true, moved, role };
    });
    // Foundry cancelling the Tab leaves focus where it was
    expect(stop.moved, `Tab number ${i + 1} didn't move`).toBe(true);
    if (!stop.inSheet) break;
    reached.push(stop.role);
  }
  // every tracker is one stop, not one per pip
  const trackers = await sheet.getByTestId("pool-tracker").count();
  expect(reached.filter((stop) => stop === "pip")).toHaveLength(trackers);
  expect([...new Set(reached)].sort()).toEqual(
    ["ability", "other", "pip", "tab", "tracker"].sort(),
  );
});

test("Enter and Space choose a tab, keep focus on it, and don't pause the game", async ({
  page,
}) => {
  const { sheet } = await pcSheet(page, "Keyed Tabs");
  const pausedBefore = await paused(page);
  const tab = (name: string) =>
    sheet.locator(".tab-strip > label", { hasText: name });

  for (const [key, name] of [
    ["Enter", "Equipment"],
    [" ", "Notes"],
  ] as const) {
    await tab(name).focus();
    await page.keyboard.press(key === " " ? "Space" : key);
    await expect(tab(name)).toHaveAttribute("data-selected");
    await expect(tab(name)).toBeFocused();
  }
  expect(await paused(page)).toBe(pausedBefore);
});

test("a sheet's tabs are one tab stop, moved along with the arrow keys", async ({
  page,
}) => {
  const { sheet } = await pcSheet(page, "Arrowed Tabs");
  const tablist = sheet.getByRole("tablist");
  const tab = (name: string) => tablist.getByRole("tab", { name });
  const panel = sheet.getByRole("tabpanel");

  await expect(tab("Abilities")).toHaveAttribute("aria-selected", "true");
  await expect(panel).toHaveAccessibleName("Abilities");
  // only the selected tab is in the Tab order
  await expect(tablist.locator("[role=tab][tabindex='0']")).toHaveCount(1);

  await tab("Abilities").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab("Combat")).toBeFocused();
  // moving focus doesn't choose the tab
  await expect(tab("Abilities")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  // round to the last
  await expect(tab("Notes")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(tab("Abilities")).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(tab("Notes")).toHaveAttribute("aria-selected", "true");
  await expect(tab("Notes")).toHaveAttribute("tabindex", "0");
  await expect(panel).toHaveAccessibleName("Notes");
  await expect(tab("Notes")).toBeFocused();

  // Tab leaves the strip for the panel
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      panel.evaluate((element) => element.contains(document.activeElement)),
    )
    .toBe(true);
});

test("a pool tracker is one tab stop, set with the arrow keys", async ({
  page,
}) => {
  const { actorId, sheet } = await pcSheet(page, "Arrowed Pools");
  const tracker = sheet
    .getByTestId("pool-tracker")
    .filter({ hasText: "Health" });
  const group = tracker.getByRole("radiogroup", { name: "Health" });
  const pip = (value: number) =>
    group.getByRole("radio", { name: String(value), exact: true });
  const pool = () =>
    page.evaluate(
      (actorId) =>
        (
          game.actors.get(actorId)!.items.getName("Health")!.system as {
            pool: number;
          }
        ).pool,
      actorId,
    );
  const start = await pool();
  const max = Number(await group.getByRole("radio").last().innerText());

  // only the pool's pip is in the Tab order
  await expect(group.locator("[tabindex='0']")).toHaveCount(1);
  await expect(pip(start)).toHaveAttribute("tabindex", "0");
  await expect(pip(start)).toHaveAttribute("aria-checked", "true");

  await pip(start).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(pip(start - 1)).toBeFocused();
  await expect.poll(pool).toBe(start - 1);
  await expect(pip(start - 1)).toHaveAttribute("aria-checked", "true");
  await expect(pip(start - 1)).toHaveAttribute("tabindex", "0");
  await page.keyboard.press("ArrowDown");
  await expect.poll(pool).toBe(start);

  // the top doesn't wrap round to the bottom (from below it, so Space
  // changes something)
  await page.keyboard.press("ArrowLeft");
  await expect.poll(pool).toBe(start - 1);
  await pip(max).focus();
  await page.keyboard.press("Space");
  await expect.poll(pool).toBe(max);
  await page.keyboard.press("ArrowRight");
  await expect(pip(max)).toBeFocused();
  await expect.poll(pool).toBe(max);

  // Tab goes on past the rest of the pips
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      group.evaluate((element) => element.contains(document.activeElement)),
    )
    .toBe(false);
});

test("Enter sets a pool from its pip, and Space opens an ability", async ({
  page,
}) => {
  const { actorId, sheet } = await pcSheet(page, "Keyed Pools");
  const pausedBefore = await paused(page);
  const tracker: Locator = sheet.getByTestId("pool-tracker").first();
  const name = (await tracker.locator("h2").innerText()).trim();
  const pip = tracker.getByRole("radio", { name: "1", exact: true });

  await pip.focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() =>
      page.evaluate(
        ({ actorId, name }) =>
          (
            game.actors.get(actorId)!.items.getName(name)!.system as {
              pool: number;
            }
          ).pool,
        { actorId, name },
      ),
    )
    .toBe(1);

  const link = sheet.locator(".inv-default-ability-name-link").first();
  const itemId = await link.getAttribute("data-item-id");
  await link.focus();
  await page.keyboard.press("Space");
  await expect
    .poll(() =>
      page.evaluate(
        ({ actorId, itemId }) =>
          game.actors.get(actorId)!.items.get(itemId!)!.sheet!.rendered,
        { actorId, itemId },
      ),
    )
    .toBe(true);
  expect(await paused(page)).toBe(pausedBefore);
});

test("clicking a tab or a pip leaves focus on it, to carry on with the arrow keys", async ({
  page,
}) => {
  const { sheet } = await pcSheet(page, "Clicked Into");
  const tab = sheet.getByRole("tab", { name: "Combat" });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(tab).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(sheet.getByRole("tab", { name: "Abilities" })).toBeFocused();

  await page.keyboard.press("Enter");
  const group = sheet.getByRole("radiogroup", { name: "Health" });
  const pip = group.getByRole("radio", { name: "0", exact: true });
  await pip.click();
  await expect(pip).toHaveAttribute("aria-checked", "true");
  await expect(pip).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    group.getByRole("radio", { name: "1", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
});

test("Tab and Space carry on from anything focused in a sheet, like a box Firefox lets you scroll", async ({
  page,
}) => {
  const { sheet } = await pcSheet(page, "Scrolled Through");
  const pausedBefore = await paused(page);
  // Firefox focuses a box that scrolls, as Chromium doesn't: the pools
  // column, say, standing in for one here
  const pools = sheet.getByTestId("pool-tracker").first().locator("..");
  await pools.evaluate((element) => {
    element.tabIndex = -1;
    element.focus();
  });
  await expect(pools).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      pools.evaluate(
        (element) =>
          element.contains(document.activeElement) &&
          document.activeElement !== element,
      ),
    )
    .toBe(true);
  expect(await paused(page)).toBe(pausedBefore);

  // and the tab panel isn't a stop of its own
  await expect(sheet.getByRole("tabpanel")).toHaveAttribute("tabindex", "-1");
});

/** Whether a document's sheet is open */
function sheetOpen(page: Page, uuid: string) {
  return page.evaluate(
    (uuid) =>
      !!(fromUuidSync(uuid) as { sheet?: { rendered: boolean } } | null)?.sheet
        ?.rendered,
    uuid,
  );
}

test("an equipment row and a party's member open from the keyboard", async ({
  page,
}) => {
  const { actorId, sheet } = await pcSheet(page, "Kit Bag");
  const itemId = await createOwnedItem(page, actorId, {
    name: "Lantern",
    type: "equipment",
  });
  await sheet.getByRole("tab", { name: "Equipment" }).click();
  const row = sheet.getByRole("button", { name: "Lantern" });
  await row.focus();
  await page.keyboard.press("Enter");
  await expect
    .poll(() => sheetOpen(page, `Actor.${actorId}.Item.${itemId}`))
    .toBe(true);

  // a handler which wants the click's event
  const partyId = await createActor(page, {
    name: "Keyed Party",
    type: "party",
  });
  await page.evaluate(
    async ({ partyId, actorId }) => {
      const party = game.actors.get(partyId)! as unknown as {
        system: { addActorIds: (ids: string[]) => Promise<unknown> };
      };
      await party.system.addActorIds([actorId]);
    },
    { partyId, actorId },
  );
  const partySheet = await openSheet(page, `Actor.${partyId}`);
  await page.evaluate(
    (actorId) => game.actors.get(actorId)!.sheet!.close(),
    actorId,
  );
  await expect.poll(() => sheetOpen(page, `Actor.${actorId}`)).toBe(false);
  await partySheet.getByRole("button", { name: "Kit Bag" }).first().focus();
  await page.keyboard.press("Space");
  await expect.poll(() => sheetOpen(page, `Actor.${actorId}`)).toBe(true);
});

test("a chat card's links and buttons open from the keyboard, and Tab moves on from them", async ({
  page,
}) => {
  const { actorId } = await pcSheet(page, "Card Player");
  const pausedBefore = await paused(page);
  const abilityId = await page.evaluate(async (actorId) => {
    const ability = game.actors.get(actorId)!.items.getName("Athletics")!;
    await (
      ability.system as unknown as { testAbility: (spend: number) => unknown }
    ).testAbility(0);
    return ability.id;
  }, actorId);
  const card = lastChatMessage(page);
  const name = card.getByRole("button", { name: "Athletics" });
  await expect(name).toBeVisible();

  // the chat log isn't a form: without the card saying it takes its own
  // keys, Foundry would cancel the Tab
  await name.focus();
  await page.keyboard.press("Tab");
  await expect(name).not.toBeFocused();
  // and from anything else in a card which takes focus (a button, say: the
  // result stands in for one here)
  const total = card.locator(".dice-total").first();
  await total.evaluate((element: HTMLElement) => {
    element.tabIndex = -1;
    element.focus();
  });
  await expect(total).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(total).not.toBeFocused();

  await name.focus();
  await page.keyboard.press("Space");
  await expect
    .poll(() => sheetOpen(page, `Actor.${actorId}.Item.${abilityId}`))
    .toBe(true);
  expect(await paused(page)).toBe(pausedBefore);
});

test("Tab leaves the tab strip from the focused tab, not the selected one", async ({
  page,
}) => {
  const { sheet } = await pcSheet(page, "Tabbed Away");
  const tab = (name: string) =>
    sheet.getByRole("tablist").getByRole("tab", { name });
  const panel = sheet.getByRole("tabpanel");
  const inPanel = () =>
    panel.evaluate((element) => element.contains(document.activeElement));

  // Notes is selected; arrow back to Equipment and Tab: into the panel, not
  // back to Notes
  await tab("Notes").click();
  await page.keyboard.press("ArrowLeft");
  await expect(tab("Equipment")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect.poll(inPanel).toBe(true);
  // and back into the strip lands on the selected tab
  await page.keyboard.press("Shift+Tab");
  await expect(tab("Notes")).toBeFocused();

  // Abilities selected; arrow on to Combat and Shift+Tab: out of the strip,
  // not to Abilities
  await tab("Abilities").click();
  await page.keyboard.press("ArrowRight");
  await expect(tab("Combat")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect
    .poll(() =>
      sheet
        .getByRole("tablist")
        .evaluate((element) => element.contains(document.activeElement)),
    )
    .toBe(false);
});

test("a tab panel with nothing to focus in it is a tab stop itself", async ({
  page,
  joinAs,
}) => {
  // an Observer's Notes tab: the notes are only text
  const actorId = await createActor(page, { name: "Read Only", type: "pc" });
  const playerId = await createPlayer(page, "Note Reader");
  await giveOwnership(page, actorId, playerId, "OBSERVER");
  const player = await joinAs("Note Reader");
  const sheet = await openSheet(player, `Actor.${actorId}`);
  await sheet.getByRole("tab", { name: "Notes" }).click();
  const panel = sheet.getByRole("tabpanel");
  await expect(panel).toHaveAttribute("tabindex", "0");
  await sheet.getByRole("tab", { name: "Notes" }).focus();
  await player.keyboard.press("Tab");
  await expect(panel).toBeFocused();

  // one with something in it leaves that to the keyboard
  await sheet.getByRole("tab", { name: "Abilities" }).click();
  await expect(sheet.getByRole("tabpanel")).toHaveAttribute("tabindex", "-1");
});

test("the portrait's Show and Edit work from the keyboard", async ({
  page,
}) => {
  const { sheet } = await pcSheet(page, "Portrayed");
  const portrait = sheet.getByRole("button", { name: "Image" });
  await portrait.focus();
  await page.keyboard.press("Enter");
  // focus goes to the overlay's buttons; the portrait isn't a button around
  // them meanwhile
  const show = sheet.getByRole("button", { name: "Show" });
  await expect(show).toBeFocused();
  await expect(sheet.getByRole("button", { name: "Image" })).toHaveCount(0);
  await page.keyboard.press("Enter");
  // the image pops out, and the overlay closes, staying closed
  await expect
    .poll(() =>
      page.evaluate(() =>
        foundry.applications.instances
          .values()
          .some((app) => app.constructor.name.includes("ImagePopout")),
      ),
    )
    .toBe(true);
  await expect(sheet.getByRole("button", { name: "Show" })).toHaveCount(0);
  await page.waitForTimeout(300);
  await expect(sheet.getByRole("button", { name: "Show" })).toHaveCount(0);
});
