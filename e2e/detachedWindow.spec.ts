import type { Page } from "@playwright/test";

import {
  createActor,
  expect,
  openSheet,
  setSettings,
  test,
} from "./foundry.ts";

// A sheet detached into its own window (Foundry's `detachWindow`) keeps its
// styling (#1537). Foundry copies the page's stylesheets into the new window
// once, so everything has to be static CSS or travel with the sheet: Panda's
// CSS and the state layers are stylesheets, the palette is inline style on
// the themed root and the window frame, and a theme's overrides and global
// CSS are <style>s inside the root. Styles that change after detaching must
// reach the new window too.

const colors = {
  accent: "rgb(1, 2, 3)",
  accentContrast: "rgb(250, 250, 250)",
  glow: "rgb(200, 100, 0)",
  wallpaper: "rgb(255, 255, 255)",
  text: "rgb(10, 20, 30)",
  backgroundButton: "rgb(240, 240, 240)",
  backgroundPrimary: "rgb(250, 240, 230)",
  backgroundSecondary: "rgb(245, 245, 245)",
  controlBorder: "rgb(90, 90, 90)",
};
const later = {
  ...colors,
  accent: "rgb(4, 5, 6)",
  backgroundPrimary: "rgb(230, 240, 250)",
};

/** A theme whose overrides, global CSS and frame all show in a value. */
const installTheme = (
  page: Page,
  name: string,
  palette: typeof colors,
  mark: string,
) =>
  page.evaluate(
    ({ name, palette, mark }) => {
      const seed = {
        schemaVersion: "v1" as const,
        displayName: name,
        largeSheetRootStyle: {},
        logo: {
          frontTextElementStyle: {},
          rearTextElementStyle: {},
          textElementsStyle: {},
          backdropStyle: {},
        },
        colors: palette,
        // reads the palette: the frame has to get it too
        appWindowStyle: { boxShadow: "0 0 0 4px var(--inv-accent)" },
        global: `.inv-tabs__content { outline: 3px dotted ${mark}; }`,
        // internal: not in the published seed type
        catalogue: { input: { textDecorationColor: mark } },
      };
      CONFIG.Investigator!.installTheme(name, seed);
    },
    { name, palette, mark },
  );

test("a detached sheet keeps its palette, catalogue classes, overrides and state layers, and follows a change of theme", async ({
  page,
}) => {
  await installTheme(page, "detachedTheme", colors, "rgb(0, 150, 0)");
  await installTheme(page, "detachedLaterTheme", later, "rgb(150, 0, 0)");
  await setSettings(page, { defaultThemeName: "detachedTheme" });
  const actorId = await createActor(page, { name: "Detached", type: "pc" });
  const sheet = await openSheet(page, `Actor.${actorId}`);
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
  // the sheet has moved: it's in the new window, not the page
  const frame = popup.locator(`[id="${sheetId}"]`);
  await expect(frame).toBeVisible();
  await expect(page.locator(`[id="${sheetId}"]`)).toHaveCount(0);

  const root = frame.locator("[data-inv-theme]").first();
  const selected = () => root.locator("input:checked + .inv-tabs__tab");
  const other = () => root.locator("input:not(:checked) + .inv-tabs__tab");
  const content = root.locator(".inv-tabs__content");
  const input = root.locator(".inv-input").first();

  const expectTheme = async (palette: typeof colors, mark: string) => {
    // the palette and catalogue classes: selected tab accent on surface,
    // the rest text, the content surface
    await expect(selected()).toHaveCSS("color", palette.accent);
    await expect(selected()).toHaveCSS(
      "background-color",
      palette.backgroundPrimary,
    );
    await expect(other().first()).toHaveCSS("color", palette.text);
    await expect(content).toHaveCSS(
      "background-color",
      palette.backgroundPrimary,
    );
    // the theme's catalogue override and global CSS
    await expect(input).toHaveCSS("text-decoration-color", mark);
    await expect(content).toHaveCSS("outline-color", mark);
    // the frame's override, with the palette on the frame
    await expect(frame).toHaveAttribute("data-inv-frame");
    await expect(frame).toHaveCSS(
      "box-shadow",
      `${palette.accent} 0px 0px 0px 4px`,
    );
  };
  await expectTheme(colors, "rgb(0, 150, 0)");

  // it still renders in the new window, and styles follow: choosing another
  // tab makes it the accented one
  const next = other().first();
  const label = (await next.textContent())!;
  await next.click();
  await expect(selected()).toHaveText(label);
  await expect(selected()).toHaveCSS("color", colors.accent);

  // state layers: hover feedback, and the focus ring
  await other().first().hover();
  await expect(other().first()).toHaveCSS(
    "box-shadow",
    new RegExp(colors.glow.replace(/[()]/g, "\\$&")),
  );
  await input.focus();
  await expect(input).toHaveCSS("outline-style", "solid");
  await expect(input).toHaveCSS("outline-color", colors.glow);

  // a theme chosen after detaching: its palette, overrides and global CSS
  // are new, so they can only have come with the sheet
  await setSettings(page, { defaultThemeName: "detachedLaterTheme" });
  await expectTheme(later, "rgb(150, 0, 0)");

  await page.evaluate(
    (actorId) => game.actors.get(actorId)!.sheet!.close(),
    actorId,
  );
  if (!popup.isClosed()) await popup.close();
});
