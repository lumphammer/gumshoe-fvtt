import type { ItemSnapshot } from "../module/snapshots/documentStores";
import { getItemStore } from "../module/snapshots/documentStores";
import { useSnapshot, useSnapshotSelector } from "./useSnapshot";

export type { ItemSnapshot };

/**
 * An immutable snapshot of an item's prepared data, with its system data typed
 * as `TSystem`. It changes (sharing whatever didn't change) whenever the item
 * or its effects do, so memoised components given parts of it re-render only
 * when those parts change.
 *
 * Write through the item itself (e.g. `item.update`, or `useSystemMethods`),
 * not the snapshot.
 */
export function useItemSnapshot<TSystem>(
  item: Item.Implementation,
): ItemSnapshot<TSystem> {
  const store = getItemStore<TSystem>(item);
  return useSnapshot(store);
}

/**
 * Something from an immutable snapshot of an item. Like `useItemSnapshot`,
 * but re-renders only when the selector's result changes (see
 * `useSnapshotSelector`).
 */
export function useItemSelector<R, TSystem = unknown>(
  item: Item.Implementation,
  selector: (item: ItemSnapshot<TSystem>) => R,
): R {
  const store = getItemStore<TSystem>(item);
  return useSnapshotSelector(store, selector);
}
