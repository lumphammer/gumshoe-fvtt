import { original, produce } from "immer";

import { replaceEqualDeep } from "../replaceEqualDeep";
import type { FoundryHelpers } from "./foundryHelpers";

// Snapshot strategies, shared by the Node benchmarks and the in-Foundry run
// (so nothing here may use Node or a live Foundry).

export type EmbeddedSource = Record<string, unknown> & { _id: string };

export type ItemSource = EmbeddedSource & {
  type: string;
  system: Record<string, unknown>;
};

export type ActorSource = Record<string, unknown> & {
  _id: string;
  system: Record<string, unknown>;
  items: ItemSource[];
  effects: EmbeddedSource[];
};

/** The actor's embedded collections: items, and active effects. */
export type Collection = "items" | "effects";
export const collections: Collection[] = ["items", "effects"];

/**
 * What a document hook tells us. `diff` is shaped like the `changes` argument
 * of `updateActor`/`updateItem`: only the changed fields, plus `_id` and
 * `_stats.modifiedTime`.
 */
export type Change =
  | { kind: "updateActor"; diff: Record<string, unknown> }
  | {
      kind: "updateEmbedded";
      collection: Collection;
      diff: Record<string, unknown> & { _id: string };
    }
  | { kind: "createEmbedded"; collection: Collection; source: EmbeddedSource }
  | { kind: "deleteEmbedded"; collection: Collection; id: string };

/** The actor without its embedded collections. */
export function actorOnly({
  items: _items,
  effects: _effects,
  ...rest
}: ActorSource): Record<string, unknown> {
  return rest;
}

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

/**
 * Apply a change to one of a snapshot's embedded collections by copying the
 * embedded document fresh (from `getLive`) and sharing what didn't change.
 */
export function applyEmbedded(
  prev: ActorSource,
  change: Exclude<Change, { kind: "updateActor" }>,
  getLive: (id: string) => EmbeddedSource | undefined,
  copy: (doc: EmbeddedSource) => EmbeddedSource = structuredClone,
): ActorSource {
  const { collection } = change;
  const docs: EmbeddedSource[] = prev[collection];
  if (change.kind === "deleteEmbedded") {
    const filtered = docs.filter((d) => d._id !== change.id);
    return filtered.length === docs.length
      ? prev
      : { ...prev, [collection]: filtered };
  }
  const id =
    change.kind === "updateEmbedded" ? change.diff._id : change.source._id;
  const live = getLive(id);
  if (!live) return prev;
  const index = docs.findIndex((d) => d._id === id);
  if (index === -1) {
    return { ...prev, [collection]: [...docs, copy(live)] };
  }
  const doc = replaceEqualDeep(docs[index], copy(live));
  return doc === docs[index]
    ? prev
    : { ...prev, [collection]: docs.with(index, doc) };
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
          // searching a draft array makes a proxy of every element it visits,
          // so search the original until this batch has added or removed
          // elements (which would make its indices stale)
          const reordered = new Set<Collection>();
          const indexOf = (collection: Collection, id: string) =>
            (reordered.has(collection)
              ? draft[collection]
              : original(draft[collection])
            ).findIndex((i) => i._id === id);
          for (const change of changes) {
            if (change.kind === "updateActor") {
              mergeObject(draft, change.diff, ops);
              continue;
            }
            const { collection } = change;
            if (change.kind === "updateEmbedded") {
              const index = indexOf(collection, change.diff._id);
              if (index !== -1) {
                mergeObject(draft[collection][index], change.diff, ops);
              }
            } else if (change.kind === "createEmbedded") {
              (draft[collection] as EmbeddedSource[]).push(
                deepClone(change.source),
              );
              reordered.add(collection);
            } else {
              const index = indexOf(collection, change.id);
              if (index !== -1) draft[collection].splice(index, 1);
              reordered.add(collection);
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
            const prevRest = actorOnly(next);
            const rest = replaceEqualDeep(prevRest, deepClone(actorOnly(live)));
            if (rest !== prevRest) {
              next = { ...next, ...rest };
            }
          } else {
            next = applyEmbedded(
              next,
              change,
              (id) => live[change.collection].find((d) => d._id === id),
              deepClone,
            );
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
