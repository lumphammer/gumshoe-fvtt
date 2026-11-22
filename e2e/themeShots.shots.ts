import type { Locator, Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createActor,
  createOwnedItem,
  expect,
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

// room around a window for its shadow or glow
const margin = 60;

/**
 * Wait until a window has finished rendering: no Suspense spinner, no tab
 * change still in its transition (the pending tab is dimmed), and its fonts
 * and images loaded.
 */
async function settle(window: Locator) {
  await expect(window.locator(".fa-spinner.fa-spin")).toHaveCount(0);
  await expect(
    window.locator(".tab-strip > label[style*=opacity]"),
  ).toHaveCount(0);
  await window.evaluate(async (root) => {
    await root.ownerDocument.fonts.ready;
    const urls = new Set<string>();
    for (const el of [root, ...root.querySelectorAll("*")]) {
      for (const pseudo of [null, "::before", "::after"]) {
        const image = getComputedStyle(el, pseudo).backgroundImage;
        for (const [, url] of image.matchAll(/url\("?([^")]+)"?\)/g)) {
          urls.add(url);
        }
      }
      if (el instanceof HTMLImageElement && el.currentSrc) {
        urls.add(el.currentSrc);
      }
    }
    // (a broken image is the theme's problem, and shows in the shot)
    await Promise.allSettled(
      [...urls].map((url) => {
        const image = new Image();
        image.src = url;
        return image.decode();
      }),
    );
  });
}

/**
 * Screenshot a window, placed with room around it for its shadow or glow.
 * Returns false, and takes none, if it looks the same as one already taken
 * (`seen`: the text of each).
 */
async function shoot(
  page: Page,
  window: Locator,
  file: string,
  seen = new Set<string>(),
) {
  await settle(window);
  const text = await window.innerText();
  if (seen.has(text)) return false;
  seen.add(text);
  const id = await window.getAttribute("id");
  await page.evaluate(
    ({ id, margin }) =>
      foundry.applications.instances
        .get(id!)
        ?.setPosition({ left: margin, top: margin }),
    { id, margin },
  );
  const box = await window.boundingBox();
  if (!box) throw new Error(`Nothing to screenshot for ${file}`);
  const viewport = page.viewportSize()!;
  const width = box.width + 2 * margin;
  const height = box.height + 2 * margin;
  if (width > viewport.width || height > viewport.height) {
    throw new Error(
      `${file}: the window and its margin (${width}x${height}) don't fit the viewport (${viewport.width}x${viewport.height})`,
    );
  }
  await page.screenshot({
    path: file,
    clip: { x: box.x - margin, y: box.y - margin, width, height },
  });
  return true;
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
    // the tests' 1000px is too short for the PC sheet and its margin. (The
    // page is shared by a worker's tests, but these workers only take shots.)
    await page.setViewportSize({ width: 1600, height: 1200 });
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
    // (it's called for the first tab before and after clicking it)
    const seen = new Set<string>();
    await visitEveryTab(pc, async () => {
      await shoot(page, pc, path.join(dir, `pc-${seen.size + 1}.png`), seen);
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
