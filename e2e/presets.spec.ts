import type { Page } from "@playwright/test";

import {
  createActor,
  expect,
  openSheet,
  test,
  visitEveryTab,
} from "./foundry.ts";
import { goTo, openSystemSettings } from "./systemSettings.ts";

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

/** Apply a preset in the system settings, and save. */
async function applyPreset(page: Page, preset: string) {
  const app = await openSystemSettings(page);
  await goTo(app, "Core");
  await app.getByLabel("System Preset").selectOption({ label: preset });
  await app.getByRole("button", { name: "Save changes" }).click();
  await expect(app).toBeHidden();
}

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
