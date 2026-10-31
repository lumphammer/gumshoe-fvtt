// @vitest-environment node

// Benchmarks for keeping an immutable, structurally shared snapshot of an
// actor in step with Foundry's mutable document (#1476): "diff-merge" (patch
// the previous snapshot with each hook's diff, under immer) vs.
// "fresh-and-share" (copy the live source, share what didn't change), either
// of the whole actor or of just the document a hook is for.
//
// Run with `pnpm bench` after `scripts/fetch-foundry-common.sh`. The fixture
// is a PC from the dev world, exported with `scripts/export-actor-fixture.ts`.
// Before the benchmarks run, this checks every strategy stays deep-equal to
// the live source over a random sequence of changes, and prints how many
// objects each one replaces per change (what a memoised tree would re-render
// for).

import assert from "node:assert/strict";
import { bench, describe } from "vitest";

import { loadFoundryHelpers } from "./foundryHelpers";
import type { ActorSource, Change, Strategy } from "./strategies";
import {
  applyToLive,
  changes,
  enlargeFixture,
  loadFixture,
} from "./simulation";
import {
  countNewNodes,
  isAbility,
  makeCloneOnly,
  makeStrategies,
} from "./strategies";

const foundry = await loadFoundryHelpers();
const strategies = makeStrategies(foundry);
const fixture = loadFixture();
const print = (line: string) => process.stdout.write(`${line}\n`);

/**
 * A scenario returns the batches of changes for one step. Each batch is
 * applied to the live source and then handed to the strategy, so a batch of
 * one is a hook call, and a bigger batch is coalesced.
 */
type Scenario = (live: ActorSource, step: number) => Change[][];

const scenarios: Record<string, Scenario> = {
  "actor field": (live, step) => [[changes.actorResource(live, step % 20)]],
  "actor long note": (live, step) => [
    [changes.actorLongNote(live, `note ${step}`)],
  ],
  "one item": (live, step) => [
    [changes.itemPool(live.items[step % live.items.length], step % 5)],
  ],
  "every ability, a hook each": (live, step) =>
    live.items.filter(isAbility).map((item) => [changes.itemPool(item, step)]),
  "every ability, coalesced": (live, step) => [
    live.items.filter(isAbility).map((item) => changes.itemPool(item, step)),
  ],
  "create + delete item": (live, step) => {
    const id = `benchItem${String(step).padStart(7, "0")}`;
    return [[changes.createItem(live.items[0], id)], [changes.deleteItem(id)]];
  },
};

function runStep(
  strategy: Strategy,
  state: { live: ActorSource; snapshot: ActorSource },
  batches: Change[][],
) {
  for (const batch of batches) {
    for (const change of batch) applyToLive(state.live, change, foundry);
    state.snapshot = strategy.apply(state.snapshot, batch, state.live);
  }
}

function initialState(actor: ActorSource) {
  return {
    live: foundry.deepClone(actor),
    snapshot: foundry.deepClone(actor),
  };
}

// /////////////////////////////////////////////////////////////////////////////
// correctness: a seeded random walk; both strategies must match the live source

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomChange(
  live: ActorSource,
  random: () => number,
  step: number,
): Change {
  const pick = <T>(xs: T[]) => xs[Math.floor(random() * xs.length)];
  const roll = random();
  if (roll < 0.25) return changes.actorResource(live, step);
  if (roll < 0.35) return changes.actorLongNote(live, `step ${step}`);
  if (roll < 0.45) return changes.actorFlag(live, step);
  if (roll < 0.5) return changes.actorFlag(live, new foundry.ForcedDeletion());
  if (roll < 0.85 || live.items.length < 10) {
    return changes.itemPool(pick(live.items), step);
  }
  if (roll < 0.93) {
    return changes.createItem(
      pick(live.items),
      `random${String(step).padStart(10, "0")}`,
    );
  }
  return changes.deleteItem(pick(live.items)._id);
}

for (const strategy of strategies) {
  const random = mulberry32(1476);
  const state = initialState(fixture);
  let step = 0;
  for (let i = 0; i < 500; i++) {
    const size = 1 + Math.floor(random() * 5);
    const batch = Array.from({ length: size }, () =>
      randomChange(state.live, random, step++),
    );
    runStep(strategy, state, [batch]);
    assert.deepEqual(
      state.snapshot,
      state.live,
      `${strategy.name} diverged from live source at batch ${i}`,
    );
  }
  print(
    `correctness: ${strategy.name} matched live source over ${step} changes`,
  );
}

// /////////////////////////////////////////////////////////////////////////////
// sharing: objects replaced per step (fewer is better; ~5 is "just the path")

const sharingScenarios: Record<string, Scenario> = {
  ...scenarios,
  "delete a middle item": (live) => [
    [changes.deleteItem(live.items[Math.floor(live.items.length / 2)]._id)],
  ],
};

print("\nobjects replaced per step:");
print(
  ["scenario".padEnd(30), ...strategies.map((s) => s.name.padStart(22))].join(
    "",
  ),
);
for (const [name, scenario] of Object.entries(sharingScenarios)) {
  const counts = strategies.map((strategy) => {
    const state = initialState(fixture);
    const before = state.snapshot;
    runStep(strategy, state, scenario(state.live, 1));
    return countNewNodes(before, state.snapshot);
  });
  print(
    [name.padEnd(30), ...counts.map((c) => String(c).padStart(22))].join(""),
  );
}
print("");

// /////////////////////////////////////////////////////////////////////////////
// timings

const fixtures: Record<string, ActorSource> = {
  [`PC, ${fixture.items.length} items`]: fixture,
  [`PC x3, ${fixture.items.length * 3} items`]: enlargeFixture(fixture, 3),
};

// stands in for Foundry updating its own source; subtract it from the others
const baseline: Strategy = { name: "baseline", apply: (prev) => prev };
const cloneOnly = makeCloneOnly(foundry);

for (const [fixtureName, actor] of Object.entries(fixtures)) {
  describe(fixtureName, () => {
    for (const [scenarioName, scenario] of Object.entries(scenarios)) {
      describe(scenarioName, () => {
        for (const strategy of [baseline, cloneOnly, ...strategies]) {
          const state = initialState(actor);
          let step = 0;
          bench(strategy.name, () => {
            runStep(strategy, state, scenario(state.live, step++));
          });
        }
      });
    }
  });
}
