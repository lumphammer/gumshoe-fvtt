import type { SnapshotStore } from "../module/snapshots/createSnapshotStore";
import { nullStore } from "../module/snapshots/createSnapshotStore";
import type {
  ItemData,
  ItemSnapshot,
} from "../module/snapshots/documentStores";
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

/**
 * Like `useItemSelector`, for an item which may not be there (e.g. the
 * ability a chat card was rolled with, which may have been deleted): the
 * selector gets null for no item.
 */
export function useMaybeItemSelector<R, TSystem = unknown>(
  item: Item.Implementation | null | undefined,
  selector: (item: ItemSnapshot<TSystem> | null) => R,
): R {
  const store: SnapshotStore<ItemData<TSystem> | null> = item
    ? getItemStore<TSystem>(item)
    : nullStore;
  return useSnapshotSelector(store, selector);
}
