// The in-Foundry half of the snapshot benchmarks (#1476): run in a page with a
// game loaded (see `e2e/snapshots.bench.ts`, which bundles this file). It
// uses the same strategies as the Node benchmarks, but against a real actor's
// `_source`, fed by real hooks, plus variants that snapshot prepared data.

import { replaceEqualDeep } from "../replaceEqualDeep";
import type {
  ActorSource,
  Change,
  Collection,
  EmbeddedSource,
  ItemSource,
  Strategy,
} from "./strategies";
import {
  actorOnly,
  applyEmbedded,
  countNewNodes,
  isAbility,
  makeStrategies,
} from "./strategies";

type AnyDoc = {
  id: string;
  _source: Record<string, unknown>;
  toObject: (source?: boolean) => Record<string, unknown>;
};
type BenchItem = AnyDoc & {
  type: string;
  parent: unknown;
  update: (data: object) => Promise<unknown>;
};
type BenchActor = AnyDoc & {
  system: { toObject: (source?: boolean) => Record<string, unknown> };
  items: { contents: BenchItem[]; get: (id: string) => BenchItem | undefined };
  update: (data: object) => Promise<unknown>;
  delete: () => Promise<unknown>;
  createEmbeddedDocuments: (type: "Item", data: object[]) => Promise<unknown>;
  deleteEmbeddedDocuments: (type: "Item", ids: string[]) => Promise<unknown>;
  updateEmbeddedDocuments: (type: "Item", data: object[]) => Promise<unknown>;
};

type HookName =
  | "updateActor"
  | `${"create" | "update" | "delete"}${"Item" | "ActiveEffect"}`;
type HookFn = (doc: unknown, diff?: unknown) => void;
const hooks = Hooks as unknown as {
  on: (name: HookName, fn: HookFn) => number;
  off: (name: HookName, id: number) => void;
};

const utils = foundry.utils as unknown as {
  mergeObject: <T>(a: T, b: unknown, o?: object) => T;
  deepClone: <T>(a: T) => T;
  objectsEqual: (a: unknown, b: unknown) => boolean;
  randomID: () => string;
};
const operators = (
  foundry as unknown as {
    data: {
      operators: {
        ForcedDeletion: new () => object;
        ForcedReplacement: new (value: unknown) => object;
      };
    };
  }
).data.operators;

function on(name: HookName, fn: HookFn): () => void {
  const id = hooks.on(name, fn);
  return () => hooks.off(name, id);
}

// /////////////////////////////////////////////////////////////////////////////
// prepared-data strategies

/**
 * A prepared snapshot of the actor: its source, but with `system` (and each
 * item's `system`) as prepared by Foundry and the system's data models.
 */
function preparedActorOnly(actor: BenchActor): Record<string, unknown> {
  const {
    items: _items,
    effects: _effects,
    system: _system,
    ...rest
  } = actor._source;
  return {
    ...utils.deepClone(rest),
    system: actor.system.toObject(false),
  };
}
const preparedItem = (item: BenchItem) => item.toObject(false) as ItemSource;
function preparedActor(actor: BenchActor): ActorSource {
  return {
    ...preparedActorOnly(actor),
    effects: utils.deepClone(actor._source["effects"]),
    items: actor.items.contents.map(preparedItem),
  } as unknown as ActorSource;
}

/** Like `fresh-and-share/doc`, but from the prepared documents. */
function makePreparedStrategy(actor: BenchActor): Strategy {
  const getLive = (collection: Collection, id: string) => {
    if (collection === "items") {
      const item = actor.items.get(id);
      return item && preparedItem(item);
    }
    const effects = actor._source["effects"] as EmbeddedSource[];
    const effect = effects.find((e) => e._id === id);
    return effect && utils.deepClone(effect);
  };
  return {
    name: "fresh-and-share/doc, prepared",
    apply: (prev, changes) => {
      let next = prev;
      for (const change of changes) {
        if (change.kind === "updateActor") {
          const prevRest = actorOnly(next);
          const rest = replaceEqualDeep(prevRest, preparedActorOnly(actor));
          if (rest !== prevRest) next = { ...next, ...rest };
        } else {
          // getLive already made a fresh copy
          next = applyEmbedded(
            next,
            change,
            (id) => getLive(change.collection, id),
            (doc) => doc,
          );
        }
      }
      return next;
    },
  };
}

/** The cost of copying the whole actor, as a reference: not a strategy. */
function makeCopyReferences(actor: BenchActor): Strategy[] {
  return [
    {
      name: "toObject() (reference)",
      apply: () => actor.toObject() as ActorSource,
    },
    {
      name: "toObject(false) (reference)",
      apply: () => actor.toObject(false) as ActorSource,
    },
  ];
}

// /////////////////////////////////////////////////////////////////////////////
// timing harness

type Tally = {
  calls: number;
  totalMs: number;
  replaced: number;
  mismatches: number;
  /** Where the first few mismatches were, as path: snapshot -> document. */
  mismatchPaths: string[];
};

/** Paths where `a` and `b` differ (items labelled by name). */
function differences(a: unknown, b: unknown, path = ""): string[] {
  if (Object.is(a, b)) return [];
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return [`${path}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`];
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].flatMap((key) => {
    const av = (a as Record<string, unknown>)[key];
    const bv = (b as Record<string, unknown>)[key];
    const name = (bv as { name?: unknown } | undefined)?.name;
    const label = typeof name === "string" ? `[${name}]` : `.${key}`;
    return differences(av, bv, path + label);
  });
}

type Results = Record<string, Record<string, Tally>>;

/**
 * Keeps one strategy's snapshot of `actor` up to date from hooks, timing
 * each `apply`. Each apply is repeated until it's taken at least a millisecond
 * (or 25 times), because the browser's clock is coarse.
 */
function attachStrategy({
  actor,
  strategy,
  coalesce,
  initial,
  expected,
  results,
  scenario,
  isReference,
}: {
  actor: BenchActor;
  strategy: Strategy;
  coalesce: boolean;
  initial: ActorSource;
  expected: () => ActorSource;
  results: Results;
  scenario: () => string;
  isReference: boolean;
}) {
  let snapshot = initial;
  const label = `${strategy.name}${coalesce ? ", coalesced" : ""}`;
  const live = actor._source as ActorSource;
  let pending: Change[] = [];

  const run = (batch: Change[]) => {
    let next: ActorSource;
    let reps = 0;
    const start = performance.now();
    let elapsed: number;
    do {
      next = strategy.apply(snapshot, batch, live);
      reps++;
      elapsed = performance.now() - start;
    } while (elapsed < 1 && reps < 25);
    const tally = ((results[scenario()] ??= {})[label] ??= {
      calls: 0,
      totalMs: 0,
      replaced: 0,
      mismatches: 0,
      mismatchPaths: [],
    });
    tally.calls++;
    tally.totalMs += elapsed / reps;
    if (!isReference) {
      tally.replaced += countNewNodes(snapshot, next);
      snapshot = next;
    }
  };

  const receive = (change: Change) => {
    if (!coalesce) {
      run([change]);
      return;
    }
    if (pending.length === 0) {
      queueMicrotask(() => {
        const batch = pending;
        pending = [];
        run(batch);
      });
    }
    pending.push(change);
  };

  const isOurs = (doc: unknown) => (doc as BenchItem).parent === actor;
  const embeddedHooks = (
    [
      ["Item", "items"],
      ["ActiveEffect", "effects"],
    ] as const
  ).flatMap(([documentName, collection]) => [
    on(`update${documentName}`, (doc, diff) => {
      if (isOurs(doc)) {
        receive({
          kind: "updateEmbedded",
          collection,
          diff: diff as EmbeddedSource,
        });
      }
    }),
    on(`create${documentName}`, (doc) => {
      if (isOurs(doc)) {
        receive({
          kind: "createEmbedded",
          collection,
          source: (doc as AnyDoc).toObject() as EmbeddedSource,
        });
      }
    }),
    on(`delete${documentName}`, (doc) => {
      if (isOurs(doc)) {
        receive({ kind: "deleteEmbedded", collection, id: (doc as AnyDoc).id });
      }
    }),
  ]);
  const offs = [
    on("updateActor", (doc, diff) => {
      if (doc === actor) {
        receive({ kind: "updateActor", diff: diff as Record<string, unknown> });
      }
    }),
    ...embeddedHooks,
  ];

  return {
    /** Check the snapshot against the document (after a step settles). */
    check: () => {
      if (isReference) return;
      const want = expected();
      if (!utils.objectsEqual(snapshot, want)) {
        const tally = results[scenario()]?.[label];
        if (tally) {
          tally.mismatches++;
          if (tally.mismatchPaths.length < 6) {
            tally.mismatchPaths.push(
              ...differences(snapshot, want).slice(0, 3),
            );
          }
        }
        // resync, so one mismatch doesn't count again in every later step
        snapshot = expected();
      }
    },
    detach: () => offs.forEach((off) => off()),
  };
}

// /////////////////////////////////////////////////////////////////////////////
// what the hooks actually send

/** A JSON-friendly copy of a hook's diff, with operators made visible. */
function describeDiff(value: unknown): unknown {
  if (value instanceof operators.ForcedDeletion) return "<ForcedDeletion>";
  if (value instanceof operators.ForcedReplacement) {
    return "<ForcedReplacement>";
  }
  if (Array.isArray(value)) return value.map(describeDiff);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, describeDiff(v)]),
    );
  }
  return value;
}

/** Paths of objects in `diff` that are also objects in the document's source. */
function aliasedPaths(diff: unknown, source: unknown): string[] {
  const inSource = new Set<unknown>();
  const collect = (value: unknown) => {
    if (typeof value !== "object" || value === null || inSource.has(value)) {
      return;
    }
    inSource.add(value);
    Object.values(value).forEach(collect);
  };
  collect(source);
  const found: string[] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value !== "object" || value === null) return;
    if (inSource.has(value)) found.push(path || "(root)");
    for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
  };
  walk(diff, "");
  return found;
}

function countFrozen(value: unknown, seen = new Set<unknown>()): number {
  if (typeof value !== "object" || value === null || seen.has(value)) return 0;
  seen.add(value);
  return (
    (Object.isFrozen(value) ? 1 : 0) +
    Object.values(value).reduce<number>((n, v) => n + countFrozen(v, seen), 0)
  );
}

const isAbilityDoc = (item: BenchItem) =>
  isAbility({ type: item.type } as ItemSource);

type CapturedDiff = {
  update: string;
  hook: string;
  diff: unknown;
  aliased: string[];
};

async function captureDiffs(actor: BenchActor): Promise<CapturedDiff[]> {
  const captured: CapturedDiff[] = [];
  let update = "";
  const offs = [
    on("updateActor", (doc, diff) => {
      if (doc !== actor) return;
      captured.push({
        update,
        hook: "updateActor",
        diff: describeDiff(diff),
        aliased: aliasedPaths(diff, actor._source),
      });
    }),
    on("updateItem", (doc, diff) => {
      if ((doc as BenchItem).parent !== actor) return;
      captured.push({
        update,
        hook: "updateItem",
        diff: describeDiff(diff),
        aliased: aliasedPaths(diff, (doc as BenchItem)._source),
      });
    }),
  ];
  const step = async (name: string, fn: () => Promise<unknown>) => {
    update = name;
    await fn();
  };
  const item = actor.items.contents.find(isAbilityDoc)!;
  try {
    await step("resource value", () =>
      actor.update({ "system.resources.health.value": 7 }),
    );
    await step("long notes array", () =>
      actor.update({ "system.longNotes": ["<p>captured</p>"] }),
    );
    await step("set a flag", () =>
      actor.update({ "flags.investigator.bench": { a: 1, b: [1, 2] } }),
    );
    await step("delete a flag (ForcedDeletion)", () =>
      actor.update({
        flags: { investigator: { bench: new operators.ForcedDeletion() } },
      }),
    );
    await step("item pool", () => item.update({ "system.pool": 3 }));
    await step("two items at once", () =>
      actor.updateEmbeddedDocuments(
        "Item",
        actor.items.contents
          .filter(isAbilityDoc)
          .slice(0, 2)
          .map((i) => ({ _id: i.id, "system.pool": 4 })),
      ),
    );
  } finally {
    offs.forEach((off) => off());
  }
  return captured;
}

// /////////////////////////////////////////////////////////////////////////////
// the run

async function createBenchActor(
  fixture: ActorSource,
  name: string,
  times: number,
): Promise<BenchActor> {
  const {
    _id: _actorId,
    _stats: _actorStats,
    folder: _folder,
    ...data
  } = utils.deepClone(fixture);
  const items = Array.from({ length: times }, () =>
    fixture.items.map(({ _stats: _s, folder: _f, ...item }) => ({
      ...utils.deepClone(item),
      _id: utils.randomID(),
    })),
  ).flat();
  const actor = await Actor.implementation.create(
    { ...data, name, items } as Actor.CreateData,
    { keepId: true, keepEmbeddedIds: true },
  );
  return actor as unknown as BenchActor;
}

const scenarios: Record<
  string,
  { steps: number; run: (actor: BenchActor, step: number) => Promise<unknown> }
> = {
  "actor field": {
    steps: 60,
    run: (actor, step) =>
      actor.update({ "system.resources.health.value": step % 20 }),
  },
  "actor long note": {
    steps: 60,
    run: (actor, step) =>
      actor.update({ "system.longNotes": [`<p>note ${step}</p>`] }),
  },
  "one item": {
    steps: 60,
    run: (actor, step) => {
      const items = actor.items.contents.filter(isAbilityDoc);
      return items[step % items.length].update({ "system.pool": step % 5 });
    },
  },
  "every ability at once": {
    steps: 8,
    run: (actor, step) =>
      actor.updateEmbeddedDocuments(
        "Item",
        actor.items.contents
          .filter(isAbilityDoc)
          .map((i) => ({ _id: i.id, "system.pool": step % 5 })),
      ),
  },
  "create + delete item": {
    steps: 30,
    run: async (actor) => {
      const template = actor.items.contents
        .find((i) => i.type === "equipment")!
        .toObject();
      const { _id: _ignored, ...data } = template;
      const created = (await actor.createEmbeddedDocuments("Item", [
        data,
      ])) as BenchItem[];
      if (!created[0]) throw new Error("createEmbeddedDocuments made nothing");
      await actor.deleteEmbeddedDocuments("Item", [created[0].id]);
    },
  },
};

export type FoundryBenchReport = {
  environment: Record<string, unknown>;
  diffs: CapturedDiff[];
  frozenInSource: Record<string, number>;
  results: Record<string, Results>;
};

export async function runFoundryBench(
  fixture: ActorSource,
): Promise<FoundryBenchReport> {
  const helpers = {
    mergeObject: utils.mergeObject,
    deepClone: utils.deepClone,
    ForcedDeletion: operators.ForcedDeletion,
  };

  const report: FoundryBenchReport = {
    environment: {
      foundry: game.version,
      system: game.system?.version,
      userAgent: navigator.userAgent,
      crossOriginIsolated: globalThis.crossOriginIsolated,
    },
    diffs: [],
    frozenInSource: {},
    results: {},
  };

  const capture = await createBenchActor(fixture, "Snapshot diffs", 1);
  report.diffs = await captureDiffs(capture);
  await capture.delete();

  for (const times of [1, 3]) {
    const actor = await createBenchActor(
      fixture,
      `Snapshot bench x${times}`,
      times,
    );
    const label = `PC, ${actor.items.contents.length} items`;
    report.frozenInSource[`${label}, before`] = countFrozen(actor._source);
    const results: Results = (report.results[label] = {});
    let scenario = "";
    const sourceStrategies = makeStrategies(helpers);
    const prepared = makePreparedStrategy(actor);
    const harnesses = [
      ...[...sourceStrategies, prepared].flatMap((strategy) =>
        [false, true].map((coalesce) =>
          attachStrategy({
            actor,
            strategy,
            coalesce,
            initial:
              strategy === prepared
                ? preparedActor(actor)
                : (actor.toObject() as ActorSource),
            expected: () =>
              strategy === prepared
                ? preparedActor(actor)
                : (actor.toObject() as ActorSource),
            results,
            scenario: () => scenario,
            isReference: false,
          }),
        ),
      ),
      ...makeCopyReferences(actor).map((strategy) =>
        attachStrategy({
          actor,
          strategy,
          coalesce: false,
          initial: actor.toObject() as ActorSource,
          expected: () => actor.toObject() as ActorSource,
          results,
          scenario: () => scenario,
          isReference: true,
        }),
      ),
    ];
    try {
      for (const [name, { steps, run }] of Object.entries(scenarios)) {
        scenario = name;
        for (let step = 0; step < steps; step++) {
          try {
            await run(actor, step);
          } catch (error) {
            throw new Error(`${label} > ${name}, step ${step}`, {
              cause: error,
            });
          }
          // let coalesced batches flush
          await new Promise((resolve) => setTimeout(resolve, 0));
          harnesses.forEach((h) => h.check());
        }
      }
    } finally {
      harnesses.forEach((h) => h.detach());
    }
    // did freezing a snapshot (immer does, in diff-merge) freeze anything
    // Foundry still holds?
    report.frozenInSource[label] =
      countFrozen(actor._source) +
      actor.items.contents.reduce(
        (n, item) => n + countFrozen(item._source),
        0,
      );
    await actor.delete();
  }
  return report;
}
