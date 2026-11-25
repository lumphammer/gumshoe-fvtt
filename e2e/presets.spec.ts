import type { Page } from "@playwright/test";

import {
  createActor,
  expect,
  openSheet,
  setSettings,
  test,
  visitEveryTab,
} from "./foundry.ts";
import { applyPreset } from "./systemSettings.ts";

const presets = [
  "Trail of Cthulhu (built-in)",
  "Night's Black Agents (built-in)",
  "Fear Itself (built-in)",
  "Ashen Stars (built-in)",
  "Casting the Runes (built-in)",
  "Dying Earth (built-in)",
  "The Esoterrorists (built-in)",
  "Mutant City Blues (built-in)",
];

test.afterEach(async ({ page }) => {
  // the default
  await applyPreset(page, presets[0]);
});

for (const preset of presets) {
  test(`${preset}: new characters' sheets render every tab`, async ({
    page,
  }) => {
    const getPresetId = () =>
      page.evaluate(
        () =>
          game.settings.get("investigator", "systemPreset" as never) as unknown,
      );
    const before = await getPresetId();
    await applyPreset(page, preset);
    if (preset !== presets[0]) {
      expect(await getPresetId()).not.toEqual(before);
    }
    for (const type of ["pc", "npc"] as const) {
      const id = await createActor(page, { name: `A ${preset} ${type}`, type });
      await visitEveryTab(await openSheet(page, `Actor.${id}`));
    }
  });
}

test.describe("CONFIG.Investigator.applyPreset", () => {
  const getSettings = (page: Page, keys: string[]) =>
    page.evaluate(
      (keys) =>
        Object.fromEntries(
          keys.map((key) => [
            key,
            game.settings.get("investigator", key as never) as unknown,
          ]),
        ),
      keys,
    );

  // a preset with only the fields it has to have, and maybe one bad value
  const installPreset = (page: Page, id: string, longNotes: unknown) =>
    page.evaluate(
      ({ id, longNotes }) => {
        CONFIG.Investigator!.installPreset(id, {
          schemaVersion: "v1",
          displayName: `Preset ${id}`,
          defaultThemeName: "tealTheme",
          investigativeAbilityCategories: ["Academic"],
          generalAbilityCategories: ["General"],
          combatAbilities: ["Scuffling"],
          occupationLabel: "Occupation",
          longNotes: longNotes as string[],
          newPCPacks: [],
          newNPCPacks: [],
          genericOccupation: "Investigator",
          pcStats: {},
          npcStats: {},
        });
      },
      { id, longNotes },
    );

  test("writes the preset, and resets what it leaves out", async ({ page }) => {
    await setSettings(page, { useCards: true, useBoost: true });
    await installPreset(page, "e2eAppliedPreset", ["Only notes"]);
    await page.evaluate(() =>
      CONFIG.Investigator!.applyPreset!("e2eAppliedPreset"),
    );
    expect(
      await getSettings(page, [
        "useCards",
        "useBoost",
        "longNotes",
        "systemPreset",
      ]),
    ).toEqual({
      useCards: false,
      useBoost: false,
      longNotes: ["Only notes"],
      systemPreset: "e2eAppliedPreset",
    });
  });

  test("changes nothing if a value is invalid", async ({ page }) => {
    await setSettings(page, { useCards: true });
    const before = await getSettings(page, [
      "useCards",
      "longNotes",
      "systemPreset",
    ]);
    await installPreset(page, "e2eInvalidPreset", "not a list");
    const error = await page.evaluate(() =>
      CONFIG.Investigator!.applyPreset!("e2eInvalidPreset").then(
        () => null,
        (error: Error) => error.message,
      ),
    );
    expect(error).toContain('"longNotes"');
    expect(
      await getSettings(page, ["useCards", "longNotes", "systemPreset"]),
    ).toEqual(before);
  });

  test("changes nothing if the schema isn't v1", async ({ page }) => {
    await setSettings(page, { useCards: true });
    const before = await getSettings(page, ["useCards", "systemPreset"]);
    const error = await page.evaluate(() => {
      // what a module written in JS could do
      CONFIG.Investigator!.installPreset("e2eV2Preset", {
        schemaVersion: "v2",
        displayName: "Not a V1 preset",
      } as never);
      return CONFIG.Investigator!.applyPreset!("e2eV2Preset").then(
        () => null,
        (error: Error) => error.message,
      );
    });
    expect(error).toContain("schemaVersion");
    expect(await getSettings(page, ["useCards", "systemPreset"])).toEqual(
      before,
    );
  });

  test("rejects an id that isn't installed", async ({ page }) => {
    const error = await page.evaluate(() =>
      CONFIG.Investigator!.applyPreset!("e2eNoSuchPreset").then(
        () => null,
        (error: Error) => error.message,
      ),
    );
    expect(error).toContain("e2eNoSuchPreset");
  });
});
