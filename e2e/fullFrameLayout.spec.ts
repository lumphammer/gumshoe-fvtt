import type { Locator, Page } from "@playwright/test";

import {
  createActor,
  expect,
  openSheet,
  setSettings,
  test,
} from "./foundry.ts";

// A theme with the full-frame layout (ThemeV2.layout): the sheet runs up under
// a see-through titlebar, a strip across the top that's still the titlebar,
// with its buttons in a row. The logo's text keeps below it. The portrait and
// sidebar are on the left.

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

/** The titlebar, and a point on it over the logo, left of the buttons. */
async function titlebar(sheet: Locator) {
  const header = sheet.locator(".window-header");
  const box = (await header.boundingBox())!;
  const logo = (await sheet.locator(".logo").boundingBox())!;
  return { header, box, x: logo.x + 20, y: box.y + box.height / 2 };
}

test("the titlebar is a see-through strip across the top, over the logo", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page);
  const { header, box } = await titlebar(sheet);
  const frame = (await sheet.boundingBox())!;
  // inside the window's border
  expect(Math.abs(box.x - frame.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(box.width - frame.width)).toBeLessThanOrEqual(4);
  await expect(header).toHaveCSS("pointer-events", "auto");
  await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(sheet.locator(".window-title")).toBeHidden();
  // the logo runs up under it
  const logo = (await sheet.locator(".logo").boundingBox())!;
  expect(logo.y).toBeLessThan(box.y + box.height);
});

test("a module's buttons join the row, inside the strip, and take clicks", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page);
  // as a module adds them: before Foundry's own
  await sheet.evaluate((frame) => {
    const header = frame.querySelector(".window-header")!;
    const first = header.querySelector(".header-control")!;
    for (let i = 0; i < 4; i++) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "header-control icon fa-solid fa-magnifying-glass";
      button.dataset["testModule"] = String(i);
      button.addEventListener("click", () => {
        button.dataset["clicked"] = "true";
      });
      header.insertBefore(button, first);
    }
  });
  const { box: strip } = await titlebar(sheet);
  const controls = await sheet
    .locator(".window-header .header-control")
    .evaluateAll((all) =>
      all
        .map((control) => control.getBoundingClientRect())
        .filter((box) => box.width > 0)
        .map(({ top, bottom }) => ({ top, bottom })),
    );
  expect(controls.length).toBeGreaterThan(4);
  for (const box of controls) {
    expect(box.top).toBeGreaterThanOrEqual(strip.y - 1);
    expect(box.bottom).toBeLessThanOrEqual(strip.y + strip.height + 1);
    // one row
    expect(box.top).toBeCloseTo(controls[0].top, 0);
  }
  const added = sheet.locator("[data-test-module='0']");
  await added.click();
  await expect(added).toHaveAttribute("data-clicked", "true");
});

test("dragging the titlebar, over the logo, moves the window", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page);
  const { x, y } = await titlebar(sheet);
  const before = await position(sheet);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 30, y + 10, { steps: 5 });
  await page.mouse.move(x + 60, y + 20, { steps: 5 });
  await page.mouse.up();
  await expect
    .poll(() => position(sheet))
    .toEqual({ left: before.left + 60, top: before.top + 20 });
});

test("a double click on the titlebar minimizes the window", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page);
  const { x, y } = await titlebar(sheet);
  await page.mouse.dblclick(x, y);
  await expect(sheet).toHaveClass(/minimized/);
  // minimized, it's an ordinary titlebar, with its title
  await expect(sheet.locator(".window-title")).toBeVisible();
  await sheet.locator(".window-header").dblclick();
  await expect(sheet).not.toHaveClass(/minimized/);
  // restored, not still restoring: closing it then would fail
  await expect
    .poll(() => sheet.evaluate((frame) => frame.getAnimations().length))
    .toBe(0);
});

test("the name, below the titlebar, can be edited", async ({ page }) => {
  const { sheet } = await openFogSheet(page);
  const text = nameText(sheet);
  await text.click();
  await expect(text).toBeFocused();
});

for (const type of ["pc", "npc"] as const) {
  for (const actorName of [
    "Al",
    "Bartholomew Fitzwilliam-Haversham the Third",
  ]) {
    test(`${type}: the portrait is on the left, and the logo's text, for "${actorName}", keeps below the titlebar and inside the logo`, async ({
      page,
    }) => {
      const { sheet } = await openFogSheet(page, type, actorName);
      // the name and the subtext, at the size they're fitted to
      const text = sheet.locator(
        ".logo .front-text-element > :not([aria-hidden])",
      );
      // all measured together, once the window has settled
      await expect(async () => {
        const logo = (await sheet.locator(".logo").boundingBox())!;
        const portrait = (await sheet
          .getByTestId("image-pickle")
          .first()
          .boundingBox())!;
        expect(portrait.x + portrait.width).toBeLessThanOrEqual(logo.x + 1);
        const { box: header } = await titlebar(sheet);
        // up and down, the lines' boxes; across, the glyphs (the elements
        // have padding)
        const boxes = await text.evaluateAll((all) =>
          all.map((el) => {
            const { top, bottom } = el.getBoundingClientRect();
            const range = document.createRange();
            range.setStart(el, 0);
            range.setEnd(el, el.childNodes.length);
            const texts = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let left = Infinity;
            let right = -Infinity;
            for (let node = texts.nextNode(); node; node = texts.nextNode()) {
              range.selectNodeContents(node);
              const glyphs = range.getBoundingClientRect();
              left = Math.min(left, glyphs.left);
              right = Math.max(right, glyphs.right);
            }
            return { top, bottom, left, right };
          }),
        );
        expect(boxes.length).toBeGreaterThan(0);
        for (const box of boxes) {
          expect(box.top).toBeGreaterThanOrEqual(header.y + header.height - 1);
          expect(box.bottom).toBeLessThanOrEqual(logo.y + logo.height + 1);
          expect(box.left).toBeGreaterThanOrEqual(logo.x - 1);
          expect(box.right).toBeLessThanOrEqual(logo.x + logo.width + 1);
        }
      }).toPass();
    });
  }
}

test("a detached window keeps the look", async ({ page }) => {
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
  await expect(frame).toHaveAttribute("data-inv-layout", "full-frame");
  await expect(frame.locator(".window-title")).toBeHidden();
  await popup.close();
});
