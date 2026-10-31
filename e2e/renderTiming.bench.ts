// How long sheets take to re-render after a document changes, and how much
// of that is React: a baseline for converting sheets to snapshots (#1476).
//
//   pnpm build:profiling   # React's profiling build, for render durations
//   RENDER_BENCH_LABEL=before pnpm bench:foundry e2e/renderTiming.bench.ts
//
// Each scenario changes a document, then waits for React to go quiet. It
// reports, per change (after a few warm-up runs):
//   - wall: from the document's hook firing to React's last commit
//   - commits: how many times React committed in the sheet
//   - react: time React spent rendering for those commits (profiling build
//     only)
//   - rendered: how many components rendered rather than bailing out
// Each test prints its results, and adds them to
// test-results/render-timing-<label>.json (which Playwright clears each run).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Page } from "@playwright/test";

import { openSheet, reloadGame, setSettings, test } from "./foundry.ts";
import { installCommitRecorder } from "./renderTiming/commitRecorder.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const label = process.env["RENDER_BENCH_LABEL"] ?? "run";
const reportPath = path.join(
  dirname,
  `../test-results/render-timing-${label}.json`,
);

const warmup = 3;
const runs = 20;

type Sample = {
  wallMs: number | null;
  commits: number;
  reactMs: number | null;
  rendered: number;
  /** Per commit: ms from the hook, components rendered, React ms. */
  perCommit: { atMs: number; rendered: number; reactMs: number | null }[];
};

/**
 * Run `renderBench.ops[op]` repeatedly, recording the commits in the React
 * roots inside `selector`.
 */
async function measure(page: Page, op: string, selector: string) {
  return page.evaluate(
    async ({ op, selector, warmup, runs }) => {
      const bench = globalThis.renderBench;
      const within = document.querySelector(selector);
      if (!within) throw new Error(`Nothing matches ${selector}`);
      const samples: Sample[] = [];
      for (let i = 0; i < warmup + runs; i++) {
        bench.hookTime = null;
        const first = bench.commits.length;
        const start = performance.now();
        await bench.ops[op](i);
        // wait until React has been quiet for a while
        let seen = -1;
        let quietSince = performance.now();
        while (
          performance.now() - quietSince < 150 &&
          performance.now() - start < 3000
        ) {
          await new Promise((resolve) => setTimeout(resolve, 20));
          if (bench.commits.length !== seen) {
            seen = bench.commits.length;
            quietSince = performance.now();
          }
        }
        const commits = bench.commits
          .slice(first)
          .filter((c) => within.contains(c.container));
        if (i < warmup) continue;
        const from = bench.hookTime ?? start;
        const durations = commits.map((c) => c.renderMs);
        samples.push({
          wallMs: commits.length ? commits.at(-1)!.time - from : null,
          commits: commits.length,
          reactMs: durations.every((d) => d !== undefined)
            ? durations.reduce((a, b) => a + b, 0)
            : null,
          rendered: commits.reduce((n, c) => n + c.rendered, 0),
          perCommit: commits.map((c) => ({
            atMs: c.time - from,
            rendered: c.rendered,
            reactMs: c.renderMs ?? null,
          })),
        });
      }
      return samples;
    },
    { op, selector, warmup, runs },
  );
}

const median = (xs: number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
const p90 = (xs: number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
};
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function summarise(samples: Sample[]) {
  const walls = samples.flatMap((s) => (s.wallMs === null ? [] : [s.wallMs]));
  const reacts = samples.flatMap((s) =>
    s.reactMs === null ? [] : [s.reactMs],
  );
  return {
    runs: samples.length,
    noCommit: samples.filter((s) => s.commits === 0).length,
    wallMedianMs: walls.length ? median(walls) : null,
    wallP90Ms: walls.length ? p90(walls) : null,
    commits: mean(samples.map((s) => s.commits)),
    reactMedianMs: reacts.length ? median(reacts) : null,
    rendered: mean(samples.map((s) => s.rendered)),
    /** Components rendered in each commit, for the first sample. */
    renderedPerCommit: samples[0]?.perCommit.map((c) => c.rendered) ?? [],
    samples,
  };
}

const results: Record<string, ReturnType<typeof summarise>> = {};

function formatResults(results: Record<string, ReturnType<typeof summarise>>) {
  const fmt = (n: number | null, digits = 2) =>
    (n === null ? "-" : n.toFixed(digits)).padStart(8);
  return [
    [
      "scenario".padEnd(40),
      "wall".padStart(8),
      "p90".padStart(8),
      "commits".padStart(8),
      "react".padStart(8),
      "rendered".padStart(9),
    ].join(""),
    ...Object.entries(results).map(
      ([name, r]) =>
        name.padEnd(40) +
        fmt(r.wallMedianMs) +
        fmt(r.wallP90Ms) +
        fmt(r.commits, 1) +
        fmt(r.reactMedianMs) +
        r.rendered.toFixed(1).padStart(9) +
        `  [${r.renderedPerCommit.join(", ")}]`.padEnd(14) +
        (r.noCommit ? `  (${r.noCommit} with no commit)` : ""),
    ),
  ].join("\n");
}

/** Time `op`, and keep the summary under `name`. */
async function record(page: Page, name: string, op: string, selector: string) {
  results[name] = summarise(await measure(page, op, selector));
}

test.beforeEach(async ({ page }) => {
  // the recorder has to be in place before React loads
  await page.addInitScript(installCommitRecorder);
  await reloadGame(page);
  // note when each change reaches this client. Registered before any sheet
  // opens, so it runs before the sheets' own hooks
  await page.evaluate(() => {
    const bench = globalThis.renderBench;
    const note = () => {
      bench.hookTime ??= performance.now();
    };
    for (const name of [
      "updateActor",
      "updateItem",
      "createItem",
      "deleteItem",
      "updateCombat",
      "updateCombatant",
    ] as const) {
      Hooks.on(name, note);
    }
  });
});

/**
 * Print this test's results, and merge them into the report (a failing test
 * restarts the worker, so there's no one place that sees every result).
 */
test.afterEach(() => {
  const report = fs.existsSync(reportPath)
    ? (JSON.parse(fs.readFileSync(reportPath, "utf8")) as {
        results: typeof results;
      })
    : { results: {} };
  Object.assign(report.results, results);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify({ label, results: report.results }, null, 2)}\n`,
  );
  console.log(formatResults(results));
  for (const key of Object.keys(results)) delete results[key];
});

test("equipment sheet", async ({ page }) => {
  await setSettings(page, {
    equipmentCategories: {
      gear: {
        name: "Gear",
        fields: {
          weight: { name: "Weight", type: "number", default: 0 },
          maker: { name: "Maker", type: "string", default: "" },
          working: { name: "Working", type: "checkbox", default: true },
        },
      },
    },
  });
  const itemId = await page.evaluate(async () => {
    const item = (await Item.create({
      name: "Lantern",
      type: "equipment",
      system: {
        categoryId: "gear",
        fields: { weight: 1, maker: "Acme", working: true },
        notes: "<p>A lantern</p>",
      },
    }))!;
    globalThis.renderBench.ops["equipment field"] = (i) =>
      item.update({ system: { fields: { weight: i } } });
    globalThis.renderBench.ops["equipment notes"] = (i) =>
      item.update({ system: { notes: `<p>A lantern, ${i}</p>` } });
    return item.id;
  });
  const sheet = await openSheet(page, `Item.${itemId}`);
  const selector = `[id="${await sheet.getAttribute("id")}"]`;
  await record(page, "equipment: field", "equipment field", selector);
  await record(page, "equipment: notes", "equipment notes", selector);
});

test("PC sheet", async ({ page }) => {
  const fixture = JSON.parse(
    fs.readFileSync(path.join(dirname, "fixtures/pc.json"), "utf8"),
  );
  const actorId = await page.evaluate(async (fixture) => {
    const { _id, _stats, folder, ...data } = fixture;
    const actor = (await Actor.create(data as Actor.CreateData, {
      keepEmbeddedIds: true,
    }))!;
    const ability = actor.items.find(
      (item) =>
        item.type === "generalAbility" &&
        actor.items.some(
          (weapon) =>
            weapon.type === "weapon" &&
            (weapon.system as { ability: string }).ability === item.name,
        ),
    )!;
    const ops = globalThis.renderBench.ops;
    ops["ability pool"] = (i) => ability.update({ system: { pool: i % 3 } });
    ops["actor health"] = (i) =>
      actor.update({ system: { resources: { health: { value: i % 10 } } } });
    return actor.id;
  }, fixture);
  const sheet = await openSheet(page, `Actor.${actorId}`);
  const selector = `[id="${await sheet.getAttribute("id")}"]`;
  const tab = (name: string) =>
    sheet.locator(".tab-strip > label", { hasText: name }).first().click();

  await tab("Abilities");
  await record(
    page,
    "PC, Abilities tab: ability pool",
    "ability pool",
    selector,
  );
  await record(
    page,
    "PC, Abilities tab: actor health",
    "actor health",
    selector,
  );
  await tab("Combat");
  await record(page, "PC, Combat tab: ability pool", "ability pool", selector);
  await tab("Equipment");
  await record(
    page,
    "PC, Equipment tab: ability pool",
    "ability pool",
    selector,
  );
});

test("combat tracker", async ({ page }) => {
  await setSettings(page, { useTurnPassingInitiative: false });
  await page.evaluate(async () => {
    const actors = await Actor.createDocuments(
      Array.from({ length: 12 }, (_, i) => ({
        name: `Combatant ${i + 1}`,
        type: "npc" as const,
      })),
    );
    const combat = (await Combat.create({ active: true, type: "classic" }))!;
    const combatants = await combat.createEmbeddedDocuments(
      "Combatant",
      actors.map((actor) => ({ actorId: actor.id })),
    );
    await combat.startCombat();
    const ops = globalThis.renderBench.ops;
    ops["initiative"] = (i) =>
      combatants[i % combatants.length].update({ initiative: 20 - (i % 10) });
    ops["next turn"] = () => combat.nextTurn();
    ui.sidebar.changeTab("combat", "primary");
  });
  await record(
    page,
    "combat tracker (12): initiative",
    "initiative",
    "#combat",
  );
  await record(page, "combat tracker (12): next turn", "next turn", "#combat");
  await page.evaluate(async () => {
    await Combat.deleteDocuments(game.combats.map((combat) => combat.id));
  });
});
