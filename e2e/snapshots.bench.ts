// Runs the in-Foundry snapshot benchmarks (#1476) on the test Foundry, via
// `pnpm bench:foundry`. Not part of `pnpm e2e` (see bench.config.ts).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build, type Rolldown } from "vite";

import type { FoundryBenchReport } from "../src/module/snapshots/bench/inFoundry.ts";
import { expect, test } from "./foundry.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const benchDir = path.join(dirname, "../src/module/snapshots/bench");
const reportPath = path.join(dirname, "../test-results/snapshots-bench.json");

/** inFoundry.ts and its imports (immer etc.) as one script for the page. */
async function bundle(): Promise<string> {
  const output = (await build({
    configFile: false,
    logLevel: "warn",
    // immer as the system's production build has it
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
      write: false,
      minify: false,
      lib: {
        entry: path.join(benchDir, "inFoundry.ts"),
        formats: ["iife"],
        name: "snapshotBench",
        fileName: "snapshotBench",
      },
    },
  })) as Rolldown.RolldownOutput[] | Rolldown.RolldownOutput;
  const [first] = Array.isArray(output) ? output : [output];
  const chunk = first.output.find((o) => o.type === "chunk");
  if (!chunk) throw new Error("bundle has no chunk");
  return chunk.code;
}

test("snapshot strategies in Foundry", async ({ page }) => {
  test.setTimeout(15 * 60_000);
  const fixture = JSON.parse(
    fs.readFileSync(path.join(benchDir, "pc.fixture.json"), "utf8"),
  );
  await page.addScriptTag({ content: await bundle() });
  const report = await page.evaluate(
    (fixture) =>
      (
        globalThis as unknown as {
          snapshotBench: {
            runFoundryBench: (f: unknown) => Promise<FoundryBenchReport>;
          };
        }
      ).snapshotBench.runFoundryBench(fixture),
    fixture,
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  const lines = [`environment: ${JSON.stringify(report.environment)}`];
  for (const [actor, scenarios] of Object.entries(report.results)) {
    for (const [scenario, strategies] of Object.entries(scenarios)) {
      lines.push(`\n${actor} > ${scenario}`);
      for (const [name, t] of Object.entries(strategies)) {
        lines.push(
          `  ${name.padEnd(42)} ${(t.totalMs / t.calls).toFixed(4).padStart(9)} ms/call` +
            `${t.calls} calls`.padStart(12) +
            `  replaced/call ${(t.replaced / t.calls).toFixed(1).padStart(6)}` +
            (t.mismatches
              ? `  MISMATCHES ${t.mismatches}\n      ${t.mismatchPaths.join("\n      ")}`
              : ""),
        );
      }
    }
  }
  lines.push(`\nfrozen in source: ${JSON.stringify(report.frozenInSource)}`);
  lines.push(`report: ${reportPath}`);
  console.log(lines.join("\n"));

  const mismatches = Object.values(report.results)
    .flatMap((s) => Object.values(s))
    .flatMap((s) => Object.values(s))
    .reduce((n, t) => n + t.mismatches, 0);
  expect(mismatches).toBe(0);
});
