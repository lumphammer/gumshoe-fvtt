// How much work the PC sheet costs for four everyday actions, for comparing
// builds (before snapshots, before React Compiler, before Panda...):
//
//   1. opening the sheet (cold: the first open after a reload; warm: again,
//      after closing it)
//   2. switching to the Abilities tab (from Notes)
//   3. switching edit mode on
//   4. clicking "+" on an ability's rating, until the update has come back
//      from the server and the sheet has caught up
//
// Each sample runs one action and waits until the sheet's React root has been
// quiet for a while (and, for "+", until the ability's update has arrived),
// then for a frame. It records:
//   - the sheet's React commits, and, with React's profiling build
//     (`pnpm build:profiling`), the components rendered and React's render
//     time
//   - the page's main-thread work over the same span, from Chrome's
//     Performance domain: all tasks, script, style recalculation and layout
//     (this is where Emotion's style insertion shows up, and Panda's CSS)
// So run each build twice: its profiling build for React's numbers, and its
// production build for the main-thread ones (the profiling build's include
// the recorder walking every commit's fibers, which a production build
// skips). "idle" runs the same wait with no action, as a baseline for the
// main-thread numbers.
//
// The fixture PC uses its own sheet theme (`niceTheme`). The selectors work
// on builds from `before-immutability` on (older ones have an Edit tab rather
// than an edit mode switch).
//
//   E2E_BUILD_PATH=... REACT_WORK_LABEL=main-prod \
//     pnpm bench:foundry e2e/reactWork.bench.ts
//
// Each test that passes writes $REACT_WORK_OUT/react-work-<label>-<test>.json
// (by default in test-results/, which Playwright clears each run).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { CDPSession, Page } from "@playwright/test";

import { reloadGame, test } from "./foundry.ts";
import {
  type Commit,
  installCommitRecorder,
} from "./renderTiming/commitRecorder.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const label = process.env["REACT_WORK_LABEL"] ?? "run";
const outDir =
  process.env["REACT_WORK_OUT"] ?? path.join(dirname, "../test-results");

const warmup = Number(process.env["REACT_WORK_WARMUP"] ?? 3);
const runs = Number(process.env["REACT_WORK_RUNS"] ?? 20);
const coldRuns = Number(process.env["REACT_WORK_COLD_RUNS"] ?? 8);

/** The ability whose rating "+" raises. */
const abilityName = "Athletics";

type Sample = {
  /** From the action to the sheet's last commit. */
  wallMs: number | null;
  commits: number;
  /** React's render time (profiling build only). */
  reactMs: number | null;
  /** Components rendered (profiling build only). */
  rendered: number | null;
  byComponent: Record<string, number>;
  /** React's render time by component, self only (profiling build only). */
  selfMsByComponent: Record<string, number>;
  /** Main-thread time, ms, from Chrome's Performance metrics. */
  taskMs: number;
  scriptMs: number;
  styleMs: number;
  layoutMs: number;
};

/** What this bench keeps in the page, beside the recorder's `renderBench`. */
type ReactWork = {
  /** The sheet's id, whose React root the samples count. */
  sheetId: string;
  /** Set up an action, outside the timing: returns the action itself. */
  prepare: Record<string, () => () => Promise<unknown>>;
  /** The action `prepare` returned, for the next sample. */
  next: (() => Promise<unknown>) | null;
  /** Checks of the sheet's state, by name: true, or what's wrong. */
  checks: Record<string, () => true | string>;
};

declare global {
  var reactWork: ReactWork;
}

const metricNames = {
  TaskDuration: "taskMs",
  ScriptDuration: "scriptMs",
  RecalcStyleDuration: "styleMs",
  LayoutDuration: "layoutMs",
} as const;

async function readMetrics(cdp: CDPSession) {
  const { metrics } = await cdp.send("Performance.getMetrics");
  const out = { taskMs: 0, scriptMs: 0, styleMs: 0, layoutMs: 0 };
  for (const { name, value } of metrics) {
    const key = metricNames[name as keyof typeof metricNames];
    if (key) out[key] = value * 1000;
  }
  return out;
}

/** Set up `op` in the page, ready to run. */
async function prepare(page: Page, op: string) {
  await page.evaluate((op) => {
    globalThis.reactWork.next = globalThis.reactWork.prepare[op]();
  }, op);
}

/**
 * Run the prepared action, and wait until the sheet's React root has been
 * quiet for a while (and, with `waitForHook`, the ability's update has
 * arrived), then for a frame. Returns where its commits start and end.
 */
function runPrepared(page: Page, waitForHook: boolean) {
  return page.evaluate(async (waitForHook) => {
    const bench = globalThis.renderBench;
    const work = globalThis.reactWork;
    const action = work.next;
    if (!action) throw new Error("nothing prepared");
    work.next = null;
    bench.hookTime = null;
    const first = bench.commits.length;
    const sheetCommits = () => {
      const sheet = document.getElementById(work.sheetId);
      let n = 0;
      for (let i = first; i < bench.commits.length; i++) {
        if (sheet?.contains(bench.commits[i].container)) n++;
      }
      return n;
    };
    const start = performance.now();
    await action();
    let seen = -1;
    let hookSeen = false;
    let quietSince = performance.now();
    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      const now = performance.now();
      const count = sheetCommits();
      if (count !== seen) {
        seen = count;
        quietSince = now;
      }
      // the update arriving starts the quiet again: the sheet may not have
      // caught up yet
      if (!hookSeen && bench.hookTime !== null) {
        hookSeen = true;
        quietSince = now;
      }
      if ((hookSeen || !waitForHook) && now - quietSince >= 150) break;
      if (now - start > 5000) throw new Error("the sheet didn't settle");
    }
    // and let the browser draw it
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    return { first, last: bench.commits.length, start };
  }, waitForHook);
}

/** Sum up the sheet's commits in a sample (after the timing). */
function summarise(
  page: Page,
  span: { first: number; last: number; start: number },
) {
  return page.evaluate(({ first, last, start }) => {
    const sheet = document.getElementById(globalThis.reactWork.sheetId);
    const commits: Commit[] = globalThis.renderBench.commits
      .slice(first, last)
      .filter((c) => sheet?.contains(c.container));
    const durations = commits.map((c) => c.renderMs);
    const profiled =
      commits.length > 0 && durations.every((d) => d !== undefined);
    const byComponent: Record<string, number> = {};
    const selfMsByComponent: Record<string, number> = {};
    for (const c of commits) {
      for (const [name, n] of Object.entries(c.byComponent)) {
        byComponent[name] = (byComponent[name] ?? 0) + n;
      }
      for (const [name, ms] of Object.entries(c.selfMsByComponent)) {
        selfMsByComponent[name] = (selfMsByComponent[name] ?? 0) + ms;
      }
    }
    return {
      wallMs: commits.length ? commits.at(-1)!.time - start : null,
      commits: commits.length,
      reactMs: profiled
        ? durations.reduce<number>((a, b) => a + (b ?? 0), 0)
        : null,
      rendered: profiled ? commits.reduce((n, c) => n + c.rendered, 0) : null,
      byComponent,
      selfMsByComponent,
    };
  }, span);
}

/** Time one action. */
async function sample(
  page: Page,
  cdp: CDPSession,
  op: string,
  { waitForHook = false, mustCommit = true } = {},
): Promise<Sample> {
  await prepare(page, op);
  const before = await readMetrics(cdp);
  const span = await runPrepared(page, waitForHook);
  const after = await readMetrics(cdp);
  const summary = await summarise(page, span);
  if (mustCommit && summary.commits === 0) {
    throw new Error(`${op}: the sheet didn't render`);
  }
  return {
    ...summary,
    taskMs: after.taskMs - before.taskMs,
    scriptMs: after.scriptMs - before.scriptMs,
    styleMs: after.styleMs - before.styleMs,
    layoutMs: after.layoutMs - before.layoutMs,
  };
}

/** Run an action, untimed, and wait for the sheet to settle. */
async function untimed(page: Page, op: string, waitForHook = false) {
  await prepare(page, op);
  await runPrepared(page, waitForHook);
}

/** Check the sheet's state. */
async function check(page: Page, name: string) {
  const result = await page.evaluate(
    (name) => globalThis.reactWork.checks[name](),
    name,
  );
  if (result !== true) throw new Error(`check failed: ${name}: ${result}`);
}

/** Whether a check passes. */
const passes = async (page: Page, name: string) =>
  (await page.evaluate((name) => globalThis.reactWork.checks[name](), name)) ===
  true;

const results: Record<string, Sample[]> = {};

/** Print a test's results, and write them out (if it passed). */
function save(testTitle: string, passed: boolean) {
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : NaN;
  };
  for (const [name, samples] of Object.entries(results)) {
    const m = (f: (s: Sample) => number | null) =>
      median(samples.flatMap((s) => (f(s) === null ? [] : [f(s)!]))).toFixed(1);
    console.log(
      `${label} ${name.padEnd(12)} n=${samples.length} wall=${m((s) => s.wallMs)} ` +
        `commits=${m((s) => s.commits)} rendered=${m((s) => s.rendered)} ` +
        `react=${m((s) => s.reactMs)} task=${m((s) => s.taskMs)} ` +
        `script=${m((s) => s.scriptMs)} style=${m((s) => s.styleMs)} ` +
        `layout=${m((s) => s.layoutMs)}`,
    );
  }
  if (passed) {
    fs.mkdirSync(outDir, { recursive: true });
    const slug = testTitle.replaceAll(/\W+/g, "-");
    fs.writeFileSync(
      path.join(outDir, `react-work-${label}-${slug}.json`),
      `${JSON.stringify({ label, test: testTitle, results }, null, 2)}\n`,
    );
  }
  for (const key of Object.keys(results)) delete results[key];
}

/** Create a fresh fixture PC (replacing any left from an earlier run). */
async function createFixture(page: Page) {
  const fixture = JSON.parse(
    fs.readFileSync(path.join(dirname, "fixtures/pc.json"), "utf8"),
  ) as { name: string; items: { type: string }[] };
  await page.evaluate(async (fixture) => {
    await Actor.deleteDocuments(
      game.actors
        .filter((a) => a.name === fixture.name)
        .flatMap((a) => (a.id ? [a.id] : [])),
    );
    // only the item types this build knows
    const types = new Set<string>(game.documentTypes.Item);
    const { _id, _stats, folder, ...data } = fixture as Record<string, unknown>;
    void _id;
    void _stats;
    void folder;
    await Actor.create(
      {
        ...data,
        items: fixture.items.filter((item) => types.has(item.type)),
      } as Actor.CreateData,
      { keepEmbeddedIds: true },
    );
  }, fixture);
}

/**
 * Set up the actions and checks for the fixture PC, and note when its
 * ability's updates reach this client (before any sheet hooks run). Once per
 * page load.
 */
async function setUp(page: Page) {
  const fixtureName = "Bill Zebub";
  await page.evaluate(
    ({ fixtureName, abilityName }) => {
      const bench = globalThis.renderBench;
      const actor = game.actors.getName(fixtureName)!;
      const ability = actor.items.getName(abilityName)!;
      const system = () => ability.system as { rating: number; pool: number };
      const original = { rating: system().rating, pool: system().pool };
      Hooks.on("updateItem", (item) => {
        if (item === ability) bench.hookTime ??= performance.now();
      });
      const sheet = () => actor.sheet as foundry.applications.api.ApplicationV2;
      const el = () => {
        const found = document.getElementById(sheet().id);
        if (!found) throw new Error("the sheet isn't open");
        return found;
      };
      const tab = (name: string) => {
        const label = [...el().querySelectorAll(".tab-strip label")].find(
          (l) => l.textContent?.trim() === name,
        ) as HTMLElement | undefined;
        if (!label) throw new Error(`no ${name} tab`);
        return label;
      };
      const editToggle = () => {
        const label = [...el().querySelectorAll("label")].find(
          (l) => l.textContent?.trim() === "Edit mode",
        );
        // ids from useId repeat across React roots, so look in the sheet
        const toggle =
          label && el().querySelector(`[id="${CSS.escape(label.htmlFor)}"]`);
        if (!(toggle instanceof HTMLElement)) {
          throw new Error("no edit mode toggle");
        }
        return toggle;
      };
      const abilityLink = () =>
        [...el().querySelectorAll("a")].find(
          (a) => a.textContent?.trim() === abilityName,
        );
      /** The rating's input and "+" in edit mode */
      const ratingInput = () => {
        const box = abilityLink()?.nextElementSibling;
        return {
          plus: box?.querySelector("i.fa-plus")?.closest("button") ?? null,
          input: box?.querySelector("input") ?? null,
        };
      };
      const click = (element: () => HTMLElement | null) => () => {
        const found = element();
        if (!found) throw new Error("nothing to click");
        return () => Promise.resolve(found.click());
      };
      const atOriginal = () =>
        system().rating === original.rating && system().pool === original.pool;

      globalThis.reactWork = {
        sheetId: sheet().id,
        next: null,
        prepare: {
          idle: () => () => Promise.resolve(),
          open: () => () => sheet().render({ force: true }),
          close: () => () => sheet().close({ animate: false }),
          "notes tab": click(() => tab("Notes")),
          "abilities tab": click(() => tab("Abilities")),
          "edit mode": click(editToggle),
          plus: click(() => ratingInput().plus),
          "reset rating": () => () =>
            atOriginal()
              ? Promise.resolve()
              : ability.update({ system: original }),
        },
        checks: {
          // the sheet's React view is there, not just Foundry's frame
          open: () =>
            !!document
              .getElementById(sheet().id)
              ?.querySelector(".tab-strip") || "no sheet",
          "on abilities": () => !!abilityLink() || "no abilities",
          "off abilities": () => !abilityLink() || "abilities still showing",
          editing: () => ratingInput().plus !== null || "not editing",
          "not editing": () => ratingInput().plus === null || "editing",
          raised: () =>
            (system().rating === original.rating + 1 &&
              ratingInput().input?.value === String(original.rating + 1)) ||
            `rating ${system().rating}, shown ${ratingInput().input?.value}`,
          "at original": () =>
            atOriginal() || `rating ${system().rating}, pool ${system().pool}`,
        },
      };
    },
    { fixtureName, abilityName },
  );
}

async function cdpFor(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  return cdp;
}

// the recorder has to be in place before React loads: once per page (tests
// share it), and from then on at every load
const recorded = new WeakSet<Page>();

test.beforeEach(async ({ page }) => {
  if (!recorded.has(page)) {
    await page.addInitScript(installCommitRecorder, {
      walk: "profiling" as const,
    });
    recorded.add(page);
  }
  await reloadGame(page);
  await createFixture(page);
});

// oxlint-disable-next-line no-empty-pattern -- Playwright needs the pattern
test.afterEach(({}, testInfo) => {
  save(testInfo.title, testInfo.status === testInfo.expectedStatus);
});

test("cold open", async ({ page }) => {
  test.setTimeout(0);
  const cdp = await cdpFor(page);
  try {
    results["cold open"] = [];
    for (let i = 0; i < coldRuns; i++) {
      await reloadGame(page);
      await setUp(page);
      // let the game finish starting up
      await page.waitForTimeout(2000);
      results["cold open"].push(await sample(page, cdp, "open"));
      await check(page, "open");
      await untimed(page, "close");
    }
  } finally {
    await cdp.detach();
  }
});

test("warm", async ({ page }) => {
  test.setTimeout(0);
  await setUp(page);
  const cdp = await cdpFor(page);
  const repeat = async (
    name: string,
    measure: () => Promise<Sample>,
    between: () => Promise<void>,
  ) => {
    results[name] = [];
    for (let i = 0; i < warmup + runs; i++) {
      await between();
      const s = await measure();
      if (i >= warmup) results[name].push(s);
    }
  };

  try {
    await page.waitForTimeout(2000);
    await repeat(
      "idle",
      () => sample(page, cdp, "idle", { mustCommit: false }),
      () => Promise.resolve(),
    );

    await untimed(page, "open");
    await repeat(
      "open",
      async () => {
        const s = await sample(page, cdp, "open");
        await check(page, "open");
        return s;
      },
      () => untimed(page, "close"),
    );

    await repeat(
      "tab",
      async () => {
        const s = await sample(page, cdp, "abilities tab");
        await check(page, "on abilities");
        return s;
      },
      async () => {
        await untimed(page, "notes tab");
        await check(page, "off abilities");
      },
    );

    await repeat(
      "edit mode",
      async () => {
        const s = await sample(page, cdp, "edit mode");
        await check(page, "editing");
        return s;
      },
      async () => {
        if (await passes(page, "editing")) await untimed(page, "edit mode");
        await check(page, "not editing");
      },
    );

    if (!(await passes(page, "editing"))) await untimed(page, "edit mode");
    await check(page, "editing");
    await repeat(
      "plus",
      async () => {
        const s = await sample(page, cdp, "plus", { waitForHook: true });
        await check(page, "raised");
        return s;
      },
      async () => {
        // every click starts from the fixture's rating and pool
        if (!(await passes(page, "at original"))) {
          await untimed(page, "reset rating", true);
        }
        await check(page, "at original");
      },
    );
  } finally {
    await cdp.detach();
  }
});
