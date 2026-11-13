import type { ThemeV2 } from "@lumphammer/investigator-fvtt-types";

import {
  createActor,
  expect,
  openSheet,
  setSettings,
  test,
} from "./foundry.ts";

// ThemeV2 (docs/theming.md): installed through CONFIG.Investigator, like a V1
// theme, and checked as it's installed

const theme: ThemeV2 = {
  schemaVersion: "v2",
  displayName: "V2 Review",
  palette: {
    polarity: "light",
    wallpaper: "rgb(238, 238, 238)",
    surface: "rgb(255, 255, 255)",
    surfaceNested: "rgb(244, 244, 244)",
    control: "rgb(221, 221, 221)",
    text: "rgb(34, 34, 34)",
    accent: "rgb(200, 0, 0)",
    line: "rgb(136, 136, 136)",
    feedback: "rgb(255, 136, 0)",
    danger: "rgb(255, 0, 0)",
    warning: "rgb(255, 204, 0)",
    success: "rgb(0, 128, 0)",
    info: "rgb(43, 108, 176)",
    cardGap: "1em 0.5em",
  },
  catalogue: {
    // a slot recipe's slot, with a palette colour
    tabs: {
      base: {
        content: { outlineStyle: "solid", outlineColor: "var(--inv-accent)" },
      },
    },
    // a compound variant for any combination of variants
    badge: {
      compoundVariants: [
        { tone: "neutral", weight: "subtle", css: { fontStyle: "italic" } },
      ],
    },
  },
  globalCss: ".inv-tabs__list { outline: 3px dotted rgb(0, 0, 200); }",
};

test("a V2 theme styles a sheet: its palette, worked-out entries, overrides and global CSS", async ({
  page,
}) => {
  await page.evaluate((theme) => {
    CONFIG.Investigator!.installTheme("v2ReviewTheme", theme);
  }, theme);
  await setSettings(page, { defaultThemeName: "v2ReviewTheme" });
  const actorId = await createActor(page, { name: "Modern", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);

  const root = sheet.locator("[data-inv-theme]").first();
  // the palette
  await expect(root).toHaveCSS("--inv-surface", "rgb(255, 255, 255)");
  await expect(root).toHaveCSS("--inv-card-gap-column", "0.5em");
  await expect(root).toHaveCSS("color-scheme", "light");
  // the selected tab is accent on surface, as the catalogue has it
  await expect(sheet.locator("input:checked + .inv-tabs__tab")).toHaveCSS(
    "color",
    "rgb(200, 0, 0)",
  );
  // what it left out, worked out (in CSS): white ink on its red accent
  const ink = await root.evaluate((el) => {
    const probe = el.appendChild(document.createElement("span"));
    probe.style.color = "var(--inv-on-accent)";
    const { color } = getComputedStyle(probe);
    probe.remove();
    return color;
  });
  expect(ink).toMatch(
    /^(rgb\(255, 255, 255\)|oklch\(1 0 0\)|color\(srgb 1 1 1\))$/,
  );
  // its overrides
  await expect(sheet.locator(".inv-tabs__content").first()).toHaveCSS(
    "outline-color",
    "rgb(200, 0, 0)",
  );
  // its global CSS
  await expect(sheet.locator(".inv-tabs__list").first()).toHaveCSS(
    "outline-style",
    "dotted",
  );
});

test("a V2 theme whose shape is wrong is refused, saying why", async ({
  page,
}) => {
  const error = await page.evaluate((theme) => {
    try {
      CONFIG.Investigator!.installTheme("brokenV2Theme", {
        ...theme,
        palette: { ...theme.palette, polarity: "dim" as "light" },
      });
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, theme);
  // (it throws before it's installed)
  expect(error).toMatch(
    /^This isn't a V2 theme: .*"light"\|"dark" at "palette.polarity"/,
  );
});
