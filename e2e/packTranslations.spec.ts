import type { Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createPlayer, expect, reloadGame, test } from "./foundry.ts";

// Babele translates the packs, from the files in `public/lang/babele`. These
// tests check that it's still wired up (it has broken silently before), not
// the translations themselves, so the expected values come from those files.

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const packName = "esoterroristsAbilities";
const abilityName = "Athletics";

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8")) as T;
}

const packIds = readJson<Record<string, Record<string, string>>>(
  "babele-sources/ids.json",
)[packName];
const abilityId = Object.keys(packIds).find(
  (id) => packIds[id] === abilityName,
)!;

function expectedTranslation(lang: string) {
  const { entries } = readJson<{
    entries: Record<string, { name: string; category: string }>;
  }>(`public/lang/babele/${lang}/investigator.${packName}.json`);
  const entry = entries[abilityName];
  return { name: entry.name, categoryId: entry.category };
}

async function setLanguage(page: Page, lang: string) {
  await page.evaluate((lang) => {
    localStorage.setItem("core.language", JSON.stringify(lang));
  }, lang);
  await reloadGame(page);
}

async function expectTranslated(page: Page, lang: string) {
  const expected = expectedTranslation(lang);
  // or the test would pass with Babele doing nothing
  expect(expected.name).not.toBe(abilityName);
  // Babele translates the index once it's ready. Wait for that before loading
  // the document, which the pack would otherwise cache untranslated.
  await expect
    .poll(() =>
      page.evaluate(
        ({ packName, abilityId }) =>
          game.packs.get(`investigator.${packName}`)!.index.get(abilityId)
            ?.name,
        { packName, abilityId },
      ),
    )
    .toBe(expected.name);
  const ability = await page.evaluate(
    async ({ packName, abilityId }) => {
      const doc = await game.packs
        .get(`investigator.${packName}`)!
        .getDocument(abilityId);
      return {
        name: doc!.name,
        categoryId: (doc!.system as { categoryId: string }).categoryId,
      };
    },
    { packName, abilityId },
  );
  expect(ability).toEqual(expected);
}

test.describe("pack translations", () => {
  test.beforeEach(async ({ page }) => {
    const version = await page.evaluate(async () => {
      const modules = game.settings.get("core", "moduleConfiguration");
      await game.settings.set("core", "moduleConfiguration", {
        ...modules,
        babele: true,
        "lib-wrapper": true,
      });
      return game.modules.get("babele")?.version;
    });
    expect(version, "Babele is installed").toBeDefined();
    test.info().annotations.push({ type: "Babele", description: version });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const modules = game.settings.get("core", "moduleConfiguration");
      await game.settings.set("core", "moduleConfiguration", {
        ...modules,
        babele: false,
        "lib-wrapper": false,
      });
    });
  });

  for (const lang of ["fr", "de", "ja"]) {
    test(`translates names and categories (${lang})`, async ({ page }) => {
      await setLanguage(page, lang);
      await expectTranslated(page, lang);
    });
  }

  // Players can't browse folders, so Babele gives them the files the GM's
  // client found: in the GM's language, whatever the player's.
  test("translates for players too", async ({ page, joinAs }) => {
    await setLanguage(page, "fr");
    await expectTranslated(page, "fr");
    await createPlayer(page, "Translation Player");
    const playerPage = await joinAs("Translation Player");
    await setLanguage(playerPage, "fr");
    await expectTranslated(playerPage, "fr");
  });
});
