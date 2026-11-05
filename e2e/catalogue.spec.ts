import {
  createActor,
  expect,
  openSheet,
  setSettings,
  test,
  updateAbility,
} from "./foundry.ts";

// The catalogue's runtime (docs/theming.md): a theme's override replaces a
// class's default, and the class's variants and states still apply on top.

const colors = {
  accent: "rgb(1, 2, 3)",
  accentContrast: "rgb(250, 250, 250)",
  glow: "rgb(200, 100, 0)",
  wallpaper: "rgb(255, 255, 255)",
  text: "rgb(10, 20, 30)",
  backgroundButton: "rgb(240, 240, 240)",
  backgroundPrimary: "rgb(255, 255, 255)",
  backgroundSecondary: "rgb(245, 245, 245)",
  controlBorder: "rgb(90, 90, 90)",
};

test("a theme's badge override replaces the default but keeps tone, states and hover", async ({
  page,
}) => {
  await page.evaluate((colors) => {
    const seed = {
      schemaVersion: "v1" as const,
      displayName: "Catalogue Review",
      largeSheetRootStyle: {},
      logo: {
        frontTextElementStyle: {},
        rearTextElementStyle: {},
        textElementsStyle: {},
        backdropStyle: {},
      },
      colors,
      // internal: not in the published seed type
      catalogue: { badge: { fontStyle: "italic", borderRadius: 0 } },
    };
    CONFIG.Investigator!.installTheme("catalogueReviewTheme", seed);
  }, colors);
  await setSettings(page, { defaultThemeName: "catalogueReviewTheme" });

  const actorId = await createActor(page, { name: "Styled", type: "pc" });
  await updateAbility(page, actorId, "Stealth", {
    situationalModifiers: [
      { id: "dark", situation: "In the dark", modifier: 1 },
    ],
  });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const badge = sheet.locator(".inv-badge", { hasText: "In the dark: +1" });

  // the override: its own declarations...
  await expect(badge).toHaveCSS("font-style", "italic");
  await expect(badge).toHaveCSS("border-top-left-radius", "0px");
  // ...and none of the default's
  await expect(badge).toHaveCSS("padding-left", "0px");
  await expect(badge).toHaveCSS("border-top-style", "none");

  // the tone (neutral, subtle) is a compound variant: still there
  await expect(badge).toHaveCSS("color", colors.text);
  await expect(badge).toHaveCSS("border-top-color", colors.controlBorder);

  // hover feedback, from the state layer
  await badge.hover();
  await expect(badge).toHaveCSS(
    "box-shadow",
    new RegExp(colors.glow.replace(/[()]/g, "\\$&")),
  );

  // pressed shows as selected
  await expect(badge).toHaveAttribute("aria-pressed", "false");
  await badge.click();
  await expect(badge).toHaveAttribute("aria-pressed", "true");
  await expect(badge).toHaveCSS("background-color", colors.accent);
  await expect(badge).toHaveCSS("color", colors.accentContrast);
});
