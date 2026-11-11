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

/** The top of the logo's text box, and how far the strip overlaps the logo. */
const textTop = (sheet: Locator) =>
  sheet.evaluate((frame) => {
    const logo = frame.querySelector<HTMLElement>(".logo")!;
    const wrapper = logo.querySelector(".text-elements-wrapper")!;
    const header = frame.querySelector(".window-header")!;
    return {
      top: wrapper.getBoundingClientRect().top,
      strip: header.getBoundingClientRect().bottom,
      overlap: parseFloat(logo.style.getPropertyValue("--inv-logo-overlap")),
    };
  });

test("the text starts at the strip's bottom edge, less the tuck", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page);
  await expect
    .poll(async () => {
      const { top, strip } = await textTop(sheet);
      return Math.round(top - strip);
    })
    .toBe(0);
  await sheet
    .locator("[data-inv-theme]")
    .first()
    .evaluate((root) =>
      (root as HTMLElement).style.setProperty("--inv-logo-strip-tuck", "6px"),
    );
  await expect
    .poll(async () => {
      const { top, strip } = await textTop(sheet);
      return Math.round(top - strip);
    })
    .toBe(-6);
});

/** Make the window's titlebar taller, by `by` pixels (unscaled). */
const growTitlebar = (frame: Locator, by: number) =>
  frame.evaluate((frame, by) => {
    const header = frame.querySelector<HTMLElement>(".window-header")!;
    header.style.height = `${header.offsetHeight + by}px`;
  }, by);

test("the overlap is measured unscaled, when the window is scaled", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page);
  await expect
    .poll(async () => (await textTop(sheet)).overlap)
    .toBeGreaterThan(0);
  const unscaled = (await textTop(sheet)).overlap;
  await sheet.evaluate((frame) => {
    foundry.applications.instances.get(frame.id)!.setPosition({ scale: 0.5 });
  });
  // measured again, at that scale
  await growTitlebar(sheet, 12);
  await expect
    .poll(async () => (await textTop(sheet)).overlap)
    .toBeCloseTo(unscaled + 12, 0);
  // and the text still starts at the strip's edge
  await expect
    .poll(async () => {
      const { top, strip } = await textTop(sheet);
      return Math.abs(top - strip) < 1;
    })
    .toBe(true);
});

test("the overlap is measured again when the logo moves in the window", async ({
  page,
}) => {
  const { sheet } = await openFogSheet(page);
  await expect
    .poll(async () => (await textTop(sheet)).overlap)
    .toBeGreaterThan(8);
  const before = (await textTop(sheet)).overlap;
  // the sheet's grid, 8px further down
  await sheet.locator(".logo").evaluate((logo) => {
    const grid = logo.parentElement!.parentElement!;
    const padding = parseFloat(getComputedStyle(grid).paddingTop);
    grid.style.paddingTop = `${padding + 8}px`;
  });
  await expect
    .poll(async () => (await textTop(sheet)).overlap)
    .toBeCloseTo(before - 8, 0);
});

test("in a detached window, the overlap is still measured", async ({
  page,
}) => {
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
  await expect
    .poll(async () => (await textTop(frame)).overlap)
    .toBeGreaterThan(0);
  const before = (await textTop(frame)).overlap;
  await growTitlebar(frame, 24);
  await expect
    .poll(async () => (await textTop(frame)).overlap)
    .toBeCloseTo(before + 24, 0);
  await popup.close();
});

test("in the standard layout, the logo's text has its whole height", async ({
  page,
}) => {
  await setSettings(page, { defaultThemeName: "tealTheme" });
  const actorId = await createActor(page, { name, type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await expect
    .poll(() =>
      sheet.locator(".logo").evaluate((logo) => {
        // in layout, not on screen: the theme transforms the text
        const wrapper = logo.querySelector<HTMLElement>(
          ".text-elements-wrapper",
        )!;
        return {
          overlap: (logo as HTMLElement).style.getPropertyValue(
            "--inv-logo-overlap",
          ),
          inset: wrapper.offsetTop,
        };
      }),
    )
    .toEqual({ overlap: "0px", inset: 0 });
});

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
