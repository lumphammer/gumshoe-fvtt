import type { Locator, Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createActor,
  createOwnedItem,
  openSheet,
  setSettings,
  test,
  visitEveryTab,
} from "./foundry.ts";

// `pnpm theme:shots`: each built-in theme's sheets, as PNGs in
// `theme-shots/<theme>/`. `THEMES=niceTheme,niceThemeDark` for fewer.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "theme-shots");

// The built-in themes' names, from `pnpm theme:print` (the themes import
// `system.json`, which Playwright can't load)
const builtIn = execFileSync("pnpm", ["exec", "tsx", "scripts/printTheme.ts"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean);

const names =
  process.env["THEMES"]
    ?.split(",")
    .map((name) => name.trim())
    .filter(Boolean) ?? builtIn;
const unknown = names.filter((name) => !builtIn.includes(name));
if (unknown.length > 0) {
  throw new Error(
    `No built-in theme ${unknown.join(", ")}. One of: ${builtIn.join(", ")}`,
  );
}

/** Screenshot a window, with a margin for its shadow or glow. */
async function shoot(page: Page, window: Locator, file: string) {
  await page.evaluate(() => document.fonts.ready);
  // the wallpaper images
  await page.waitForLoadState("networkidle");
  const box = await window.boundingBox();
  if (!box) throw new Error(`Nothing to screenshot for ${file}`);
  const viewport = page.viewportSize()!;
  const margin = 30;
  const x = Math.max(0, box.x - margin);
  const y = Math.max(0, box.y - margin);
  await page.screenshot({
    path: file,
    clip: {
      x,
      y,
      width: Math.min(viewport.width, box.x + box.width + margin) - x,
      height: Math.min(viewport.height, box.y + box.height + margin) - y,
    },
  });
}

async function closeWindow(page: Page, window: Locator) {
  const id = await window.getAttribute("id");
  await page.evaluate(async (id) => {
    await foundry.applications.instances.get(id!)?.close({ animate: false });
  }, id);
}

for (const name of names) {
  test(name, async ({ page }) => {
    test.setTimeout(120_000);
    const dir = path.join(outDir, name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    await setSettings(page, { defaultThemeName: name });

    const pcId = await createActor(page, { name: "Shot PC", type: "pc" });
    const weaponId = await createOwnedItem(page, pcId, {
      name: "Revolver",
      type: "weapon",
    });
    await createOwnedItem(page, pcId, {
      name: "A Mysterious Key",
      type: "equipment",
    });

    // every tab of the PC sheet, and its settings
    const pc = await openSheet(page, `Actor.${pcId}`);
    let tab = 0;
    await visitEveryTab(pc, async () => {
      tab++;
      await shoot(page, pc, path.join(dir, `pc-${tab}.png`));
    });
    await closeWindow(page, pc);

    const npcId = await createActor(page, { name: "Shot NPC", type: "npc" });
    const npc = await openSheet(page, `Actor.${npcId}`);
    await shoot(page, npc, path.join(dir, "npc.png"));
    await closeWindow(page, npc);

    // the small sheets
    const abilityId = await page.evaluate(
      (pcId) => game.actors.get(pcId)!.items.getName("Athletics")!.id,
      pcId,
    );
    for (const [file, itemId] of [
      ["ability", abilityId],
      ["weapon", weaponId],
    ]) {
      const item = await openSheet(page, `Actor.${pcId}.Item.${itemId}`);
      await shoot(page, item, path.join(dir, `${file}.png`));
      await closeWindow(page, item);
    }
  });
}
