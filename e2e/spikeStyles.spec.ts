// SPIKE (#1532): throwaway. Records how the converted components look and
// behave under an engine, for comparing engines. Writes to $SPIKE_OUT.
import fs from "node:fs";
import path from "node:path";

import type { Locator, Page } from "@playwright/test";

import {
  createActor,
  createOwnedItem,
  expect,
  openSheet,
  reloadGame,
  setSettings,
  test,
} from "./foundry.ts";
import { stabilityRulesOn } from "./stabilitySettings.ts";

const out = process.env["SPIKE_OUT"] ?? "spike-out";
fs.mkdirSync(out, { recursive: true });
const save = (name: string, data: unknown) =>
  fs.writeFileSync(path.join(out, name), JSON.stringify(data, null, 2));

const props = [
  "background-color",
  "color",
  "border-radius",
  "outline",
  "border-bottom",
  "text-transform",
  "font-style",
  "text-decoration-line",
  "text-decoration-style",
  "font-family",
  "border-top",
  "padding",
];

async function look(locator: Locator) {
  return locator.evaluate((el, props) => {
    const cs = getComputedStyle(el);
    return {
      className: el.className,
      ...Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)])),
    };
  }, props);
}

async function setUp(page: Page, theme: string) {
  await setSettings(page, {
    ...stabilityRulesOn,
    useBonds: true,
    useCards: true,
    defaultThemeName: theme,
  });
  const actorId = await createActor(page, {
    name: `Spike ${theme}`,
    type: "pc",
  });
  // boost the first ability, for a "Boosted" badge
  await page.evaluate(async (actorId) => {
    const ability = game.actors
      .get(actorId)!
      .items.find((i) => i.type === "generalAbility")!;
    await ability.update({ system: { boost: true } });
  }, actorId);
  await createOwnedItem(page, actorId, {
    name: "Spike Bond",
    type: "bond",
    system: { isDeltaGreen: true, points: 0 },
  });
  await createOwnedItem(page, actorId, {
    name: "Spike Card",
    type: "card",
    system: {
      supertitle: "Supertitle",
      subtitle: "Subtitle",
      description: "<p>Description</p>",
      effects: "<p>Effects</p>",
    },
  });
  return actorId;
}

for (const theme of ["tealTheme", "niceThemeDark", "mutantCityBlueTheme"]) {
  test(`look under ${theme}`, async ({ page }) => {
    const actorId = await setUp(page, theme);
    const sheet = await openSheet(page, `Actor.${actorId}`);
    const result: Record<string, unknown> = {};

    await sheet.locator(".tab-strip > label", { hasText: "Abilities" }).click();
    const boosted = sheet.locator("span", { hasText: /^Boosted$/ }).first();
    await expect(boosted).toBeVisible();
    result["boostedBadge"] = await look(boosted);
    await boosted.screenshot({ path: path.join(out, `${theme}-badge.png`) });

    await sheet.locator(".tab-strip > label", { hasText: "Bonds" }).click();
    const bondRow = sheet.locator("[data-testid=bond-name]").first();
    await expect(bondRow).toBeVisible();
    const badges = sheet.locator("span", { hasText: /^(Delta Green|Broken)$/ });
    result["bondBadges"] = [
      await look(badges.nth(0)),
      await look(badges.nth(1)),
    ];
    const row = bondRow.locator("xpath=ancestor::a[1]/..");
    await row.hover();
    result["bondRowHover"] = await look(row);
    await row.screenshot({ path: path.join(out, `${theme}-bond-row.png`) });

    await sheet.locator(".tab-strip > label", { hasText: "Cards" }).click();
    const card = sheet.locator(".investigator-card-display").first();
    await expect(card).toBeVisible();
    result["cardRoot"] = await look(card);
    result["cardTitle"] = await look(card.locator("h2"));
    result["cardEffect"] = await look(card.locator(".effects"));
    await card.screenshot({ path: path.join(out, `${theme}-card.png`) });

    // element defaults: a heading and a button inside the sheet
    result["h2"] = await look(sheet.locator("h2").first());
    await sheet.screenshot({ path: path.join(out, `${theme}-sheet.png`) });
    save(`${theme}.json`, result);
  });
}

test("cascade layers, in priority order", async ({ page }) => {
  const layers = await page.evaluate(() => {
    const names: string[] = [];
    const walk = (rules: CSSRuleList, prefix: string) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSLayerStatementRule) {
          for (const n of rule.nameList) {
            const full = prefix ? `${prefix}.${n}` : n;
            if (!names.includes(full)) names.push(full);
          }
        } else if (rule instanceof CSSLayerBlockRule) {
          const full = prefix ? `${prefix}.${rule.name}` : rule.name;
          if (rule.name && !names.includes(full)) names.push(full);
          walk(rule.cssRules, full);
        } else if (rule instanceof CSSImportRule && rule.styleSheet) {
          const full = rule.layerName
            ? prefix
              ? `${prefix}.${rule.layerName}`
              : rule.layerName
            : prefix;
          walk(rule.styleSheet.cssRules, full);
        } else if ("cssRules" in rule) {
          walk((rule as CSSGroupingRule).cssRules, prefix);
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules, "");
      } catch {
        // cross-origin
      }
    }
    return names.filter((n) => n.startsWith("system"));
  });
  save("layers.json", layers);
});

test("a popped-out sheet keeps its styles", async ({ page, context }) => {
  const modules = await page.evaluate(() =>
    game.settings.get("core", "moduleConfiguration"),
  );
  await page.evaluate(async (modules) => {
    await game.settings.set("core", "moduleConfiguration", {
      ...(modules as object),
      popout: true,
    } as never);
  }, modules);
  await reloadGame(page);
  try {
    const actorId = await setUp(page, "niceThemeDark");
    await openSheet(page, `Actor.${actorId}`);
    const popupPromise = context.waitForEvent("page");
    await page.evaluate((actorId) => {
      // a class declared by PopOut!'s classic script: global, not on window
      // eslint-disable-next-line no-eval
      const PopoutModule = (0, eval)("PopoutModule") as {
        popoutApp: (app: unknown) => void;
      };
      PopoutModule.popoutApp(game.actors.get(actorId)!.sheet);
    }, actorId);
    const popup = await popupPromise;
    await popup.waitForLoadState();
    const tabs = popup.locator(".tab-strip > label", { hasText: "Bonds" });
    await expect(tabs).toBeVisible();
    await tabs.click();
    const badge = popup.locator("span", { hasText: /^Broken$/ }).first();
    await expect(badge).toBeVisible();
    // let any late style insertion happen
    await popup.waitForTimeout(500);
    const result = {
      brokenBadge: await look(badge),
      h2: await look(popup.locator("h2").first()),
    };
    await popup.screenshot({ path: path.join(out, `popout.png`) });
    save("popout.json", result);
    await popup.close();
  } finally {
    await page.evaluate(async (modules) => {
      await game.settings.set("core", "moduleConfiguration", modules as never);
    }, modules);
    await reloadGame(page);
  }
});
