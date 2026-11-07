import type { Locator } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  setSettings,
  test,
  updateAbility,
} from "./foundry.ts";

// The catalogue's runtime (docs/theming.md): a theme's override replaces a
// class's default, and the class's variants and states still apply on top,
// even when the override replaces the rule the state is in.

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
      catalogue: {
        badge: { fontStyle: "italic", borderRadius: 0 },
        "badge--compound__tone_neutral__weight_subtle": {
          color: "rgb(200, 0, 0)",
        },
      },
    };
    CONFIG.Investigator!.installTheme("catalogueReviewTheme", seed);
  }, colors);
  await setSettings(page, { defaultThemeName: "catalogueReviewTheme" });

  const actorId = await createActor(page, { name: "Styled", type: "pc" });
  await updateAbility(page, actorId, "Stealth", {
    situationalModifiers: [
      { id: "dark", situation: "In the dark", modifier: 1 },
    ],
    unlocks: [{ id: "hide", rating: 0, description: "Hide" }],
  });
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const badge = sheet.locator(".inv-badge", { hasText: "In the dark: +1" });
  const unlock = sheet.locator(".inv-badge", { hasText: "Hide" });

  // the override: its own declarations...
  await expect(badge).toHaveCSS("font-style", "italic");
  await expect(badge).toHaveCSS("border-top-left-radius", "0px");
  // ...and none of the default's
  await expect(badge).toHaveCSS("padding-left", "0px");
  await expect(badge).toHaveCSS("border-top-style", "none");

  // replacing the base keeps the tones (compound variants): neutral, strong
  await expect(unlock).toHaveCSS("background-color", colors.backgroundButton);
  await expect(unlock).toHaveCSS("color", colors.text);
  // and a compound can be replaced too
  await expect(badge).toHaveCSS("color", "rgb(200, 0, 0)");

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

  // and from the keyboard
  await badge.focus();
  await page.keyboard.press("Enter");
  await expect(badge).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press(" ");
  await expect(badge).toHaveAttribute("aria-pressed", "true");
});

test("a panel's depth comes from where it sits, and V1 panel styles still apply", async ({
  page,
}) => {
  const primary = "rgb(0, 0, 200)";
  const secondary = "rgb(0, 200, 0)";
  await page.evaluate(
    ({ colors, primary, secondary }) => {
      CONFIG.Investigator!.installTheme("panelReviewTheme", {
        schemaVersion: "v1" as const,
        displayName: "Panel Review",
        largeSheetRootStyle: {},
        logo: {
          frontTextElementStyle: {},
          rearTextElementStyle: {},
          textElementsStyle: {},
          backdropStyle: {},
        },
        colors,
        panelStylePrimary: {
          backgroundColor: primary,
          border: "3px solid rgb(0, 128, 0)",
        },
        panelStyleSecondary: { backgroundColor: secondary },
      });
    },
    { colors, primary, secondary },
  );
  await setSettings(page, { defaultThemeName: "panelReviewTheme" });

  const actorId = await createActor(page, { name: "Armed", type: "pc" });
  const revolverId = await createOwnedItem(page, actorId, {
    name: "Revolver",
    type: "weapon",
  });
  await page.evaluate(
    async ({ actorId, revolverId }) => {
      await game.actors
        .get(actorId)!
        .update({ system: { readyWeaponId: revolverId } });
    },
    { actorId, revolverId },
  );
  const sheet = await openSheet(page, `Actor.${actorId}`);

  // on the sheet: stats and pools, with the primary style
  const top = sheet.locator(".inv-panel--depth_top");
  await expect(top).toHaveCount(2);
  for (const panel of await top.all()) {
    await expect(panel).toHaveCSS("background-color", primary);
    await expect(panel).toHaveCSS("border-top-width", "3px");
    await expect(panel).toHaveCSS("padding-top", /^\d+(\.\d+)?px$/);
  }

  // in a tab: the attack panel, with the secondary style and none of the
  // primary's; and it's the grid itself, as before
  await sheet.locator(".tab-strip > label", { hasText: "Combat" }).click();
  const attack = sheet.locator(".inv-panel--depth_nested");
  await expect(attack).toContainText(/Revolver/);
  await expect(attack).toHaveCSS("background-color", secondary);
  await expect(attack).toHaveCSS("border-top-width", "0px");
  await expect(attack).toHaveCSS("display", "grid");
});

/** A colour as the browser computes it where `near` is (for color-mix). */
const resolve = (near: Locator, color: string) =>
  near.evaluate((el, color) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = color;
    el.parentElement!.append(probe);
    const resolved = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return resolved;
  }, color);

test("a callout takes its tone, and a drop target shows when it's ready and when something's over it", async ({
  page,
}) => {
  const danger = "rgb(200, 0, 0)";
  const warning = "rgb(200, 150, 0)";
  await page.evaluate(
    ({ colors }) => {
      CONFIG.Investigator!.installTheme("calloutReviewTheme", {
        schemaVersion: "v1" as const,
        displayName: "Callout Review",
        largeSheetRootStyle: {},
        logo: {
          frontTextElementStyle: {},
          rearTextElementStyle: {},
          textElementsStyle: {},
          backdropStyle: {},
        },
        colors,
      });
    },
    { colors: { ...colors, danger, warning } },
  );
  await setSettings(page, {
    defaultThemeName: "calloutReviewTheme",
    useBonds: true,
    useLethalityAndAutofire: true,
    useShotDryAndJams: true,
  });
  const actorId = await createActor(page, { name: "Armed", type: "pc" });

  // a weapon with no ammo can't fire: a danger callout
  const weaponId = await createOwnedItem(page, actorId, {
    name: "Revolver",
    type: "weapon",
    system: {
      usesAmmo: true,
      ammo: { min: 0, max: 6, value: 0 },
      jammed: true,
    },
  });
  const weapon = await openSheet(page, `Actor.${actorId}.Item.${weaponId}`);
  const callout = weapon.locator(".inv-callout--tone_danger").first();
  await expect(callout).toHaveRole("status");
  await expect(callout).toHaveCSS("border-left-color", danger);
  await expect(callout).toHaveCSS("border-left-style", "solid");
  // text ink on a tint of the tone over the solid surface
  await expect(callout).toHaveCSS("color", colors.text);
  await expect(callout).toHaveCSS(
    "background-color",
    await resolve(
      callout,
      "color-mix(in srgb, var(--inv-danger) 30%, var(--inv-surface-solid))",
    ),
  );

  // its action is as wide as its content, not the whole row
  const jammed = weapon.locator(".inv-callout", {
    has: page.getByRole("button", { name: /clear jam/i }),
  });
  const clear = jammed.getByRole("button", { name: /clear jam/i });
  const [rowWidth, buttonWidth] = await Promise.all([
    jammed.evaluate((el) => el.getBoundingClientRect().width),
    clear.evaluate((el) => el.getBoundingClientRect().width),
  ]);
  expect(buttonWidth).toBeLessThan(rowWidth / 2);

  // two push pools: advice, so a warning callout
  await page.evaluate(async (id) => {
    const pools = game.actors
      .get(id)!
      .items.filter((i) => i.type === "generalAbility")
      .slice(0, 2);
    for (const pool of pools) await pool.update({ system: { isPushPool: true } });
  }, actorId);
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await sheet.getByLabel("Edit mode").click();
  const advice = sheet.locator(".inv-callout--tone_warning").first();
  await expect(advice).toHaveCSS("border-left-color", warning);
  await expect(advice).toHaveCSS(
    "background-color",
    await resolve(
      advice,
      "color-mix(in srgb, var(--inv-warning) 30%, var(--inv-surface-solid))",
    ),
  );

  // a Bond's actor row is always ready for an actor
  const bondId = await createOwnedItem(page, actorId, {
    name: "Bob",
    type: "bond",
  });
  const bond = await openSheet(page, `Actor.${actorId}.Item.${bondId}`);
  const actorRow = bond.getByTestId("bond-actor");
  await expect(actorRow).toHaveAttribute("data-drop-state", "ready");
  await expect(actorRow).toHaveCSS("outline-style", "dashed");
  await expect(actorRow).toHaveCSS("outline-color", colors.controlBorder);

  // focus still shows on a drop target (none is focusable yet, so make it)
  await actorRow.evaluate((el) => (el.tabIndex = 0));
  await page.keyboard.press("Shift");
  await actorRow.focus();
  await expect(actorRow).toHaveCSS("outline-style", "solid");
  await expect(actorRow).toHaveCSS("outline-color", colors.glow);
  await actorRow.blur();

  // and shows it when something's over it
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await actorRow.dispatchEvent("dragover", { dataTransfer });
  await expect(actorRow).toHaveAttribute("data-drop-state", "over");
  await expect(actorRow).toHaveCSS("outline-color", colors.accent);
  await expect(actorRow).toHaveCSS(
    "background-color",
    await resolve(
      actorRow,
      "color-mix(in srgb, var(--inv-feedback) 25%, transparent)",
    ),
  );
  await actorRow.dispatchEvent("dragleave", { dataTransfer });
  await expect(actorRow).toHaveAttribute("data-drop-state", "ready");
});

test("controls: a checkbox's box can be replaced, check buttons work from the keyboard, toggles and invalid fields take the palette", async ({
  page,
}) => {
  const danger = "rgb(200, 0, 0)";
  await page.evaluate(
    ({ colors }) => {
      const seed = {
        schemaVersion: "v1" as const,
        displayName: "Controls Review",
        largeSheetRootStyle: {},
        logo: {
          frontTextElementStyle: {},
          rearTextElementStyle: {},
          textElementsStyle: {},
          backdropStyle: {},
        },
        colors,
        // internal: not in the published seed type
        catalogue: {
          checkbox__box: { background: "rgb(0, 160, 0)", width: "2em" },
        },
      };
      CONFIG.Investigator!.installTheme("controlsReviewTheme", seed);
    },
    { colors: { ...colors, danger } },
  );
  await setSettings(page, { defaultThemeName: "controlsReviewTheme" });
  const actorId = await createActor(page, { name: "Checked", type: "pc" });
  await updateAbility(page, actorId, "Athletics", { pool: 3, rating: 3 });

  // the checkbox's box: the override replaces it, border and all
  const sheet = await openSheet(page, `Actor.${actorId}`);
  await sheet.getByLabel("Edit mode").click();
  const box = sheet.locator(".inv-checkbox__box").first();
  await expect(box).toHaveCSS("background-color", "rgb(0, 160, 0)");
  await expect(box).toHaveCSS("border-top-style", "none");
  // and the tick shows when it's checked
  const tick = box.locator(".inv-checkbox__tick");
  await expect(tick).toHaveCSS("visibility", "hidden");
  await box.click();
  await expect(tick).toHaveCSS("visibility", "visible");

  // a toggle that's on: accent track, onAccent thumb
  const editMode = sheet.locator(".inv-toggle__track", {
    has: page.locator(".inv-toggle__thumb"),
  });
  await expect(editMode.first()).toHaveAttribute("data-state", "checked");
  await expect(editMode.first()).toHaveCSS("background-color", colors.accent);
  await expect(editMode.first().locator(".inv-toggle__thumb")).toHaveCSS(
    "background-color",
    colors.accentContrast,
  );

  // check buttons: the chosen one is a pressed toolbar button, and the
  // arrow keys move it, showing focus on the label
  const athletics = await page.evaluate(
    (id) => game.actors.get(id)!.items.getName("Athletics")!.id,
    actorId,
  );
  const ability = await openSheet(
    page,
    `Actor.${actorId}.Item.${athletics}`,
  );
  const zero = ability.getByRole("radio", { name: "0" });
  const label = (n: string) =>
    ability.locator("label.inv-button", { hasText: new RegExp(`^${n}$`) });
  await expect(zero).toBeChecked();
  await expect(label("0")).toHaveAttribute("data-pressed", "true");
  await expect(label("0")).toHaveCSS("background-color", colors.accent);
  await page.keyboard.press("Shift");
  await zero.focus();
  await expect(label("0")).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("ArrowRight");
  await expect(ability.getByRole("radio", { name: "1" })).toBeChecked();
  await expect(label("1")).toHaveAttribute("data-pressed", "true");
  await expect(label("0")).not.toHaveAttribute("data-pressed");
  // more than the pool: disabled
  await expect(label("4")).toHaveAttribute("data-disabled", "true");

  // an invalid field (a rating below 0): a danger border
  const rating = ability.getByLabel("Rating", { exact: true });
  await rating.fill("-5");
  await expect(rating).toHaveAttribute("aria-invalid", "true");
  await expect(rating).toHaveCSS("border-top-color", danger);
});

test("tabs: the selected one is accent on surface, the rest text on a fainter surface, and V1 tab styles still apply", async ({
  page,
}) => {
  const install = (name: string, extra: object) =>
    page.evaluate(
      ({ colors, name, extra }) => {
        CONFIG.Investigator!.installTheme(name, {
          schemaVersion: "v1" as const,
          displayName: name,
          largeSheetRootStyle: {},
          logo: {
            frontTextElementStyle: {},
            rearTextElementStyle: {},
            textElementsStyle: {},
            backdropStyle: {},
          },
          colors,
          ...extra,
        });
      },
      { colors, name, extra },
    );
  await install("tabsDefaultTheme", {});
  await install("tabsV1Theme", {
    tabStyle: { color: "rgb(0, 0, 200)", border: "3px solid rgb(0, 0, 200)" },
    tabActiveStyle: { background: "rgb(0, 200, 0)" },
  });

  await setSettings(page, { defaultThemeName: "tabsDefaultTheme" });
  const actorId = await createActor(page, { name: "Tabbed", type: "pc" });
  let sheet = await openSheet(page, `Actor.${actorId}`);
  const selected = () => sheet.locator("input:checked + .inv-tabs__tab");
  const other = () => sheet.locator("input:not(:checked) + .inv-tabs__tab");
  await expect(selected()).toHaveCSS("color", colors.accent);
  await expect(selected()).toHaveCSS(
    "background-color",
    colors.backgroundPrimary,
  );
  await expect(other().first()).toHaveCSS("color", colors.text);
  // backgroundPrimary is opaque white here: white at 80% opacity
  await expect(other().first()).toHaveCSS(
    "background-color",
    /^oklch\(0\.99\d* [\d.]+ [\d.]+ \/ 0\.8\)$/,
  );
  await expect(sheet.locator(".inv-tabs__content")).toHaveCSS(
    "background-color",
    colors.backgroundPrimary,
  );

  // a V1 theme's tab styles, as overrides
  await page.evaluate((id) => game.actors.get(id)!.sheet!.close(), actorId);
  await setSettings(page, { defaultThemeName: "tabsV1Theme" });
  sheet = await openSheet(page, `Actor.${actorId}`);
  await expect(other().first()).toHaveCSS("color", "rgb(0, 0, 200)");
  await expect(other().first()).toHaveCSS("border-top-width", "3px");
  await expect(selected()).toHaveCSS("background-color", "rgb(0, 200, 0)");
  await expect(selected()).toHaveCSS("border-top-width", "3px");
  // and nothing of the default selected look that V1 didn't have: the
  // selected tab keeps tabStyle's colour, not the palette's accent
  await expect(selected()).toHaveCSS("color", "rgb(0, 0, 200)");
});

test("lists: headings and column headers are ruled in line, interactive rows are highlighted, and a variant override patches", async ({
  page,
}) => {
  await page.evaluate((colors) => {
    const seed = {
      schemaVersion: "v1" as const,
      displayName: "Lists Review",
      largeSheetRootStyle: {},
      logo: {
        frontTextElementStyle: {},
        rearTextElementStyle: {},
        textElementsStyle: {},
        backdropStyle: {},
      },
      colors,
      // internal: not in the published seed type. A variant override
      // patches: the highlight stays
      catalogue: { "row--interactive_true": { cursor: "crosshair" } },
    };
    CONFIG.Investigator!.installTheme("listsReviewTheme", seed);
  }, colors);
  await setSettings(page, {
    defaultThemeName: "listsReviewTheme",
    equipmentCategories: { general: { name: "General", fields: {} } },
  });
  const actorId = await createActor(page, { name: "Listed", type: "pc" });
  await createOwnedItem(page, actorId, { name: "Knife", type: "weapon" });
  await createOwnedItem(page, actorId, {
    name: "Lantern",
    type: "equipment",
    system: { categoryId: "general" },
  });
  const sheet = await openSheet(page, `Actor.${actorId}`);

  // the ability categories
  const heading = sheet.locator("h2.inv-section-heading").first();
  await expect(heading).toHaveCSS("border-bottom-style", "solid");
  await expect(heading).toHaveCSS(
    "border-bottom-color",
    colors.controlBorder,
  );

  // the weapons table: bold, ruled headers, and a row that's highlighted
  // under the pointer and on keyboard focus
  await sheet.locator(".tab-strip > label", { hasText: "Combat" }).click();
  const header = sheet.locator(".inv-table-header").first();
  await expect(header).toHaveCSS("border-bottom-color", colors.controlBorder);
  await expect(header.getByText("Name", { exact: true })).toHaveCSS(
    "font-weight",
    "700",
  );
  const knife = sheet.locator(".inv-row--interactive_true", {
    hasText: "Knife",
  });
  const highlight = await resolve(
    knife,
    "color-mix(in srgb, var(--inv-feedback) 25%, transparent)",
  );
  await expect(knife).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(knife).toHaveCSS("cursor", "crosshair");
  await knife.hover();
  await expect(knife).toHaveCSS("background-color", highlight);
  await page.mouse.move(0, 0);
  await page.keyboard.press("Shift");
  await knife.focus();
  await expect(knife).toHaveCSS("background-color", highlight);

  // an equipment row, drawn as cells: its bar is highlighted from them, and
  // its column headers are bold
  await sheet.locator(".tab-strip > label", { hasText: "Equipment" }).click();
  await expect(
    sheet.locator(".inv-table-header > div").first(),
  ).toHaveCSS("font-weight", "700");
  await sheet.getByText("Lantern", { exact: true }).hover();
  await expect(sheet.locator("[data-highlighted]")).toHaveCSS(
    "background-color",
    highlight,
  );
});
