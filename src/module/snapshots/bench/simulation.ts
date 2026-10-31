import fs from "fs";
import { original, produce } from "immer";

import { replaceEqualDeep } from "../replaceEqualDeep";
import type { FoundryHelpers } from "./foundryHelpers";

export type ItemSource = Record<string, unknown> & {
  _id: string;
  type: string;
  system: Record<string, unknown>;
};

export type ActorSource = Record<string, unknown> & {
  _id: string;
  system: Record<string, unknown>;
  items: ItemSource[];
};

/**
 * What a document hook tells us. `diff` is shaped like the `changes` argument
 * of `updateActor`/`updateItem`: only the changed fields, plus `_id` and
 * `_stats.modifiedTime`.
 */
export type Change =
  | { kind: "updateActor"; diff: Record<string, unknown> }
  | { kind: "updateItem"; diff: Record<string, unknown> & { _id: string } }
  | { kind: "createItem"; source: ItemSource }
  | { kind: "deleteItem"; id: string };

/**
 * A way of keeping an immutable snapshot in step with a live document. `apply`
 * is given the changes since the last snapshot (one, or a coalesced batch) and
 * the live source, which has already had them applied, as it has by the time
 * Foundry calls a hook.
 */
export interface Strategy {
  name: string;
  apply: (
    prev: ActorSource,
    changes: Change[],
    live: ActorSource,
  ) => ActorSource;
}

export function loadFixture(): ActorSource {
  const url = new URL("./pc.fixture.json", import.meta.url);
  return JSON.parse(fs.readFileSync(url, "utf8"));
}

/** The fixture with its items repeated `times` times, under new ids. */
export function enlargeFixture(actor: ActorSource, times: number): ActorSource {
  const items = Array.from({ length: times }, (_, n) =>
    actor.items.map((item) => ({
      ...structuredClone(item),
      _id: n === 0 ? item._id : `${item._id.slice(0, 13)}~${n}`,
    })),
  ).flat();
  return { ...structuredClone(actor), items };
}

export function makeStrategies({
  mergeObject,
  deepClone,
}: FoundryHelpers): Strategy[] {
  const ops = { applyOperators: true };
  return [
    {
      // what the combat tracker does today: patch the previous snapshot with
      // each hook's diff, under immer
      name: "diff-merge",
      apply: (prev, changes) =>
        produce(prev, (draft) => {
          // searching `draft.items` makes a proxy of every item it visits, so
          // search the original array until this batch has added or removed
          // items (which would make its indices stale)
          let reordered = false;
          const indexOf = (id: string) =>
            (reordered ? draft.items : original(draft.items)).findIndex(
              (i) => i._id === id,
            );
          for (const change of changes) {
            if (change.kind === "updateActor") {
              mergeObject(draft, change.diff, ops);
            } else if (change.kind === "updateItem") {
              const index = indexOf(change.diff._id);
              if (index !== -1) {
                mergeObject(draft.items[index], change.diff, ops);
              }
            } else if (change.kind === "createItem") {
              draft.items.push(deepClone(change.source));
              reordered = true;
            } else {
              const index = indexOf(change.id);
              if (index !== -1) draft.items.splice(index, 1);
              reordered = true;
            }
          }
        }),
    },
    {
      // ignore the diffs: take a fresh copy of the whole live source (actor
      // and items) and share whatever didn't change with the previous snapshot
      name: "fresh-and-share",
      apply: (prev, _changes, live) => replaceEqualDeep(prev, deepClone(live)),
    },
    {
      // ignore the diffs' contents, but use which document each hook is for:
      // only that document is copied and compared
      name: "fresh-and-share/doc",
      apply: (prev, changes, live) => {
        let next = prev;
        for (const change of changes) {
          if (change.kind === "updateActor") {
            const { items: _prevItems, ...prevRest } = next;
            const { items: _liveItems, ...liveRest } = live;
            const rest = replaceEqualDeep(prevRest, deepClone(liveRest));
            if (rest !== prevRest) next = { ...rest, items: next.items };
          } else if (change.kind === "updateItem") {
            const id = change.diff._id;
            const index = next.items.findIndex((i) => i._id === id);
            const liveItem = live.items.find((i) => i._id === id);
            if (index === -1 || !liveItem) continue;
            const item = replaceEqualDeep(
              next.items[index],
              deepClone(liveItem),
            );
            if (item !== next.items[index]) {
              next = { ...next, items: next.items.with(index, item) };
            }
          } else if (change.kind === "createItem") {
            const liveItem = live.items.find(
              (i) => i._id === change.source._id,
            );
            if (liveItem) {
              next = { ...next, items: [...next.items, deepClone(liveItem)] };
            }
          } else {
            const items = next.items.filter((i) => i._id !== change.id);
            if (items.length !== next.items.length) next = { ...next, items };
          }
        }
        return next;
      },
    },
  ];
}

/**
 * Not a snapshot strategy (it shares nothing): the cost of copying the whole
 * live source, which is most of what `fresh-and-share` does.
 */
export function makeCloneOnly({ deepClone }: FoundryHelpers): Strategy {
  return {
    name: "clone only",
    apply: (_prev, _changes, live) => deepClone(live),
  };
}

/** Apply a change to the live source, as Foundry would before the hook. */
export function applyToLive(
  live: ActorSource,
  change: Change,
  { mergeObject, deepClone }: FoundryHelpers,
) {
  const ops = { applyOperators: true };
  if (change.kind === "updateActor") {
    mergeObject(live, deepClone(change.diff), ops);
  } else if (change.kind === "updateItem") {
    const item = live.items.find((i) => i._id === change.diff._id);
    if (item) mergeObject(item, deepClone(change.diff), ops);
  } else if (change.kind === "createItem") {
    live.items.push(deepClone(change.source));
  } else {
    const index = live.items.findIndex((i) => i._id === change.id);
    if (index !== -1) live.items.splice(index, 1);
  }
}

let clock = 1_800_000_000_000;
const stats = () => ({ _stats: { modifiedTime: clock++ } });

export const changes = {
  actorResource: (actor: ActorSource, value: number): Change => ({
    kind: "updateActor",
    diff: {
      _id: actor._id,
      system: { resources: { health: { value } } },
      ...stats(),
    },
  }),
  actorLongNote: (actor: ActorSource, text: string): Change => ({
    kind: "updateActor",
    diff: {
      _id: actor._id,
      system: { longNotes: [`<p>${text}</p>`] },
      ...stats(),
    },
  }),
  actorFlag: (actor: ActorSource, value: unknown): Change => ({
    kind: "updateActor",
    diff: { _id: actor._id, flags: { investigator: { bench: value } } },
  }),
  itemPool: (item: ItemSource, pool: number): Change => ({
    kind: "updateItem",
    diff: { _id: item._id, system: { pool }, ...stats() },
  }),
  createItem: (template: ItemSource, id: string): Change => ({
    kind: "createItem",
    source: { ...structuredClone(template), _id: id },
  }),
  deleteItem: (id: string): Change => ({ kind: "deleteItem", id }),
};

export const isAbility = (item: ItemSource) =>
  item.type === "generalAbility" || item.type === "investigativeAbility";

/**
 * How many objects and arrays in `next` are not shared with `prev`, i.e. how
 * many things a memoised tree would see as changed.
 */
export function countNewNodes(prev: unknown, next: unknown): number {
  const seen = new Set<unknown>();
  const collect = (value: unknown) => {
    if (typeof value !== "object" || value === null || seen.has(value)) return;
    seen.add(value);
    Object.values(value).forEach(collect);
  };
  collect(prev);
  const count = (value: unknown): number => {
    if (typeof value !== "object" || value === null || seen.has(value)) {
      return 0;
    }
    return 1 + Object.values(value).reduce<number>((n, v) => n + count(v), 0);
  };
  return count(next);
}
