import type { Locator } from "@playwright/test";

import {
  createActor,
  expect,
  openSheet,
  setSettings,
  test,
} from "./foundry.ts";
import { testTheme } from "./themes.ts";

// The name at the top of a character sheet is sized to fit the width of the
// logo.

/**
 * The name's font size as a fraction of its full size, whether that's the size
 * it's heading for, and whether it fits.
 */
function measure(sheet: Locator) {
  return sheet.locator(".logo .text-elements-wrapper").evaluate((wrapper) => {
    const front = wrapper.querySelector<HTMLElement>(".front-text-element")!;
    const text = front.querySelector<HTMLElement>("[contenteditable]")!;
    // the hidden copy at full size
    const full = front.querySelector<HTMLElement>(
      ":scope > [aria-hidden] > * > *",
    )!;
    const size = (element: Element) =>
      parseFloat(getComputedStyle(element).fontSize);
    const scale = size(text) / size(full);
    // the glyphs, not the element (which has padding, and may be as wide as
    // the subtext). On screen, so with any transform, which is fine for the
    // themes we test, which at most scale the logo evenly
    const range = document.createRange();
    range.selectNodeContents(text);
    const glyphs = range.getBoundingClientRect();
    const box = wrapper.getBoundingClientRect();
    const target = Number(wrapper.style.getPropertyValue("--logo-fit") || 1);
    return {
      scale,
      settled: Math.abs(scale - target) < 0.001,
      fits: glyphs.left >= box.left && glyphs.right <= box.right,
    };
  });
}

const settledAtFullSize = { scale: 1, settled: true, fits: true };

test("a short name is shown at full size", async ({ page }) => {
  const actorId = await createActor(page, { name: "Al", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await expect.poll(() => measure(sheet)).toEqual(settledAtFullSize);
});

for (const theme of ["highContrastTheme", "niceTheme", "fearTheme"]) {
  test(`a long name shrinks to fit, and grows again when shortened (${theme})`, async ({
    page,
  }) => {
    const actorId = await createActor(page, {
      name: "Professor Henry Armitage of Miskatonic University",
      type: "pc",
      system: { sheetTheme: theme },
    });
    const sheet = await openSheet(page, `Actor.${actorId}`);
    await expect
      .poll(async () => {
        const { scale, settled, fits } = await measure(sheet);
        return settled && fits && scale < 0.9;
      })
      .toBe(true);

    await page.evaluate(async (id) => {
      await game.actors.get(id)!.update({ name: "Al" });
    }, actorId);
    await expect.poll(() => measure(sheet)).toEqual(settledAtFullSize);
  });
}

test("a long name is shown at its fitted size straight away", async ({
  page,
}) => {
  const actorId = await createActor(page, {
    name: "Professor Henry Armitage of Miskatonic University",
    type: "pc",
  });
  // from before the sheet opens, record the name's size (as a fraction of its
  // full size) as painted on each frame: sampled just after the paint, since
  // in requestAnimationFrame we'd see the size from before it's been fitted.
  // Not the first time we see it, though: it may have been added since the
  // last paint, so we'd see a size it's never had on screen
  await page.evaluate(() => {
    const scales: number[] = [];
    (window as unknown as { logoScales: number[] }).logoScales = scales;
    let seen: HTMLElement | null = null;
    const sample = () => {
      const text = document.querySelector<HTMLElement>(
        ".logo .front-text-element [contenteditable]",
      );
      const full = document.querySelector<HTMLElement>(
        ".logo .front-text-element > [aria-hidden] > * > *",
      );
      const isNew = text !== seen;
      seen = text;
      if (text?.offsetWidth && full && !isNew) {
        const size = (element: Element) =>
          parseFloat(getComputedStyle(element).fontSize);
        scales.push(size(text) / size(full));
      }
      if (scales.length < 60) {
        requestAnimationFrame(() => setTimeout(sample));
      }
    };
    requestAnimationFrame(() => setTimeout(sample));
  });
  await openSheet(page, `Actor.${actorId}`);
  const recorded = () =>
    page.evaluate(
      () => (window as unknown as { logoScales: number[] }).logoScales,
    );
  // a second's worth of frames, longer than the transition
  await expect.poll(async () => (await recorded()).length).toBe(60);
  const scales = await recorded();
  // if it animated down from full size, it would start big and change
  expect(scales[0]).toBeLessThan(0.9);
  expect(new Set(scales).size).toBe(1);
});

test("a long occupation doesn't shrink the name", async ({ page }) => {
  const actorId = await createActor(page, { name: "Al", type: "pc" });
  await page.evaluate(async (id) => {
    // a new PC's only personal detail is its occupation
    const occupation = game.actors
      .get(id)!
      .items.find((item) => item.type === "personalDetail")!;
    await occupation.update({
      name: "Professor of Medieval Metaphysics and Comparative Folklore",
    });
  }, actorId);
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await expect.poll(() => measure(sheet)).toEqual(settledAtFullSize);
});

// a V2 theme says only what it changes about the logo: the layout, the fit and
// the text's look by default are LogoEditable's
const colors = {
  accent: "rgb(200, 0, 0)",
  accentContrast: "rgb(255, 255, 255)",
  glow: "rgb(255, 136, 0)",
  wallpaper: "rgb(238, 238, 238)",
  text: "rgb(34, 34, 34)",
  backgroundButton: "rgb(221, 221, 221)",
  backgroundPrimary: "rgb(255, 255, 255)",
  backgroundSecondary: "rgb(244, 244, 244)",
};
const v2Themes = {
  // no overrides: the name is in the palette's text colour
  plainLogoTheme: testTheme("Plain logo", colors),
  // the name's own size, spacing and padding, and a transform
  restyledLogoTheme: testTheme("Restyled logo", colors, {
    catalogue: {
      logo: {
        base: {
          text: { transform: "scale(0.7)", fontWeight: "bold" },
          front: {
            fontSize: "1.5em",
            letterSpacing: "0.2em",
            padding: "0 2em",
          },
        },
      },
    },
  }),
  // the palette's letter spacing, which shrinks with the name
  spacedLogoTheme: {
    ...testTheme("Spaced logo", colors),
    palette: {
      ...testTheme("Spaced logo", colors).palette,
      displayLetterSpacing: "0.3em",
    },
  },
};

for (const [id, theme] of Object.entries(v2Themes)) {
  test(`a V2 theme's logo shows the name, fitted (${id})`, async ({ page }) => {
    await page.evaluate(
      ([id, theme]) => CONFIG.Investigator!.installTheme(id, theme),
      [id, theme] as const,
    );
    await setSettings(page, { defaultThemeName: id });
    const actorId = await createActor(page, {
      name: "Professor Henry Armitage of Miskatonic University",
      type: "pc",
    });
    const sheet = await openSheet(page, `Actor.${actorId}`);
    await expect(
      sheet.locator(".logo .front-text-element [contenteditable]").first(),
    ).toHaveCSS("color", colors.text);
    await expect
      .poll(async () => {
        const { scale, settled, fits } = await measure(sheet);
        return settled && fits && scale < 0.9;
      })
      .toBe(true);
  });
}
