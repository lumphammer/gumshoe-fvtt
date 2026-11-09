import type { Locator, Page } from "@playwright/test";

import {
  createActor,
  expect,
  openSheet,
  setSettings,
  test,
} from "./foundry.ts";

// A theme with the full-frame layout (ThemeV2.layout): the sheet runs under a
// see-through titlebar, which lets clicks through to the logo, which is what
// the window is dragged by. The portrait and sidebar are on the left, so the
// titlebar's buttons are over the logo, which keeps its name clear of them.

const name = "Al";

async function openFogSheet(
  page: Page,
  type: "pc" | "npc" = "pc",
  actorName = name,
) {
  await setSettings(page, { defaultThemeName: "fogTheme" });
  const actorId = await createActor(page, { name: actorName, type });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  return { sheet, actorId };
}

const position = (sheet: Locator) =>
  sheet.evaluate((frame) => {
    const { left, top } = foundry.applications.instances.get(
      frame.id,
    )!.position;
    return { left, top };
  });

const nameText = (sheet: Locator) =>
  sheet.locator(".logo .front-text-element [contenteditable]").first();

/** The logo's name, where it's under the titlebar. */
async function nameUnderTitlebar(sheet: Locator) {
  const text = nameText(sheet);
  const header = await sheet.locator(".window-header").boundingBox();
  const box = await text.boundingBox();
  // the layout puts the logo under the titlebar, at least partly
  expect(box!.y).toBeLessThan(header!.y + header!.height);
  return {
    text,
    box: box!,
    x: box!.x + box!.width / 2,
    y: Math.max(box!.y + 2, header!.y + header!.height / 2),
  };
}

const selection = (page: Page) =>
  page.evaluate(() => document.getSelection()?.toString() ?? "");

test("the titlebar lets clicks through to the logo, which can be edited", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page);
  await expect(sheet.locator(".window-header")).toHaveCSS(
    "pointer-events",
    "none",
  );
  await expect(
    sheet.locator(".window-header .header-control").first(),
  ).toHaveCSS("pointer-events", "auto");
  const { text, x, y } = await nameUnderTitlebar(sheet);
  const before = await position(sheet);
  await page.mouse.click(x, y);
  await expect(text).toBeFocused();
  expect(await position(sheet)).toEqual(before);
});

test("dragging the logo moves the window, without editing or selecting", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page);
  const { text, x, y } = await nameUnderTitlebar(sheet);
  const before = await position(sheet);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 30, y + 10, { steps: 5 });
  await page.mouse.move(x + 60, y + 20, { steps: 5 });
  await page.mouse.up();
  await expect
    .poll(() => position(sheet))
    .toEqual({ left: before.left + 60, top: before.top + 20 });
  await expect(text).not.toBeFocused();
  expect(await selection(page)).toBe("");
  await expect(text).toHaveText(name);
});

test("once the name is being edited, dragging over it selects", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page, "pc", "Alberta Moss");
  const { text, box } = await nameUnderTitlebar(sheet);
  const y = box.y + box.height / 2;
  await page.mouse.click(box.x + box.width / 2, y);
  await expect(text).toBeFocused();
  const before = await position(sheet);
  await page.mouse.move(box.x + 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, y, { steps: 5 });
  await page.mouse.move(box.x + box.width - 2, y, { steps: 5 });
  await page.mouse.up();
  expect((await selection(page)).length).toBeGreaterThan(3);
  expect(await position(sheet)).toEqual(before);
  await expect(text).toBeFocused();
});

test("a double click on the logo, off its text, minimizes the window", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page);
  const logo = await sheet.locator(".logo").boundingBox();
  // the logo's left end: a short name is in the middle
  await page.mouse.dblclick(logo!.x + 10, logo!.y + logo!.height - 10);
  await expect(sheet).toHaveClass(/minimized/);
  // minimized, it's an ordinary titlebar, with its title
  const header = sheet.locator(".window-header");
  await expect(header).toHaveCSS("pointer-events", "auto");
  await expect(sheet.locator(".window-title")).toBeVisible();
  await header.dblclick();
  await expect(sheet).not.toHaveClass(/minimized/);
  // restored, not still restoring: closing it then would fail
  await expect
    .poll(() => sheet.evaluate((frame) => frame.getAnimations().length))
    .toBe(0);
});

for (const type of ["pc", "npc"] as const) {
  test(`${type}: the portrait is on the left, and a long name keeps clear of the titlebar's buttons`, async ({
    page,
  }) => {
    const { sheet } = await openFogSheet(
      page,
      type,
      "Bartholomew Fitzwilliam-Haversham the Third",
    );
    const logo = await sheet.locator(".logo").boundingBox();
    const portrait = await sheet
      .getByTestId("image-pickle")
      .first()
      .boundingBox();
    expect(portrait!.x + portrait!.width).toBeLessThanOrEqual(logo!.x + 1);
    const controls = await sheet
      .locator(".window-header .header-control")
      .evaluateAll((all) =>
        Math.min(
          ...all
            .map((control) => control.getBoundingClientRect())
            .filter((box) => box.width > 0)
            .map((box) => box.left),
        ),
      );
    // the name, at the size it's fitted to
    await expect
      .poll(async () => {
        const box = await nameText(sheet).boundingBox();
        return box!.x + box!.width;
      })
      .toBeLessThanOrEqual(controls);
  });
}

test("a drag stops when the window stops being full-frame", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page);
  const { x, y } = await nameUnderTitlebar(sheet);
  const before = await position(sheet);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 30, y + 10, { steps: 5 });
  await expect
    .poll(() => position(sheet))
    .toEqual({ left: before.left + 30, top: before.top + 10 });
  await setSettings(page, { defaultThemeName: "tealTheme" });
  await expect(sheet).not.toHaveAttribute("data-inv-layout");
  const moved = await position(sheet);
  await page.mouse.move(x + 90, y + 40, { steps: 5 });
  await page.mouse.up();
  expect(await position(sheet)).toEqual(moved);
});

test("a double click on the name minimizes nothing, even when it can't be edited", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page, "pc", "Alberta Moss");
  const text = nameText(sheet);
  // as a Limited user's is
  await text.evaluate((el) => el.setAttribute("contenteditable", "false"));
  await text.dblclick();
  await page.waitForTimeout(500);
  await expect(sheet).not.toHaveClass(/minimized/);
});

test("the controls are measured unscaled, when the window is scaled", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page);
  const measured = () =>
    sheet.evaluate((frame) =>
      parseFloat(frame.style.getPropertyValue("--inv-window-controls-width")),
    );
  await expect.poll(measured).toBeGreaterThan(0);
  const unscaled = await measured();
  // scaled, then the titlebar changes, so they're measured again at that
  // scale
  await sheet.evaluate((frame) => {
    foundry.applications.instances.get(frame.id)!.setPosition({ scale: 0.5 });
    frame
      .querySelector(".window-header")!
      .append(document.createElement("span"));
  });
  await page.waitForTimeout(300);
  await expect.poll(measured).toBeCloseTo(unscaled, -0.5);
});

test("a detached window keeps the standard titlebar", async ({ page }) => {
  const { sheet, actorId } = await openFogSheet(page);
  const sheetId = (await sheet.getAttribute("id"))!;
  const popupPromise = page.waitForEvent("popup");
  await page.evaluate(async (actorId) => {
    const sheet = game.actors.get(actorId)!.sheet as unknown as {
      detachWindow: () => Promise<void>;
    };
    await sheet.detachWindow();
  }, actorId);
  const popup = await popupPromise;
  await popup.waitForLoadState();
  const frame = popup.locator(`[id="${sheetId}"]`);
  await expect(frame).toBeVisible();
  const header = frame.locator(".window-header");
  await expect(header).toHaveCSS("pointer-events", "auto");
  // and the logo's name isn't kept in from the sides
  await expect(frame.locator(".text-elements-wrapper").first()).toHaveCSS(
    "left",
    "0px",
  );
  await popup.close();
});
