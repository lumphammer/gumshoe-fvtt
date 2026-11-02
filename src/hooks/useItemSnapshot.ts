import type { SnapshotStore } from "../module/snapshots/createSnapshotStore";
import { nullStore } from "../module/snapshots/createSnapshotStore";
import type { ItemSnapshot } from "../module/snapshots/documentStores";
import { getItemStore } from "../module/snapshots/documentStores";
import type { SnapshotOfItem } from "../module/snapshots/snapshotTypes";
import { useSnapshot, useSnapshotSelector } from "./useSnapshot";

export type { ItemSnapshot, SnapshotOfItem };

const storeOf = <I extends Item.Implementation>(item: I) =>
  getItemStore(item) as unknown as SnapshotStore<SnapshotOfItem<I>>;

/**
 * An immutable snapshot of an item's prepared data, typed from the item's type
 * (a `WeaponItem`'s has a weapon's system data). It changes (sharing whatever
 * didn't change) whenever the item or its effects do, so memoised components
 * given parts of it re-render only when those parts change.
 *
 * Write through the item itself (e.g. `item.update`, or `useSystemMethods`),
 * not the snapshot.
 */
export function useItemSnapshot<I extends Item.Implementation>(
  item: I,
): SnapshotOfItem<I> {
  return useSnapshot(storeOf(item)) as SnapshotOfItem<I>;
}

/**
 * Something from an immutable snapshot of an item. Like `useItemSnapshot`,
 * but re-renders only when the selector's result changes (see
 * `useSnapshotSelector`).
 */
export function useItemSelector<I extends Item.Implementation, R>(
  item: I,
  selector: (item: SnapshotOfItem<I>) => R,
): R {
  return useSnapshotSelector(storeOf(item), (snapshot) =>
    selector(snapshot as SnapshotOfItem<I>),
  );
}

/**
 * Like `useItemSelector`, for an item which may not be there (e.g. the
 * ability a chat card was rolled with, which may have been deleted): the
 * selector gets null for no item.
 */
export function useMaybeItemSelector<I extends Item.Implementation, R>(
  item: I | null | undefined,
  selector: (item: SnapshotOfItem<I> | null) => R,
): R {
  const store: SnapshotStore<unknown> = item ? storeOf(item) : nullStore;
  return useSnapshotSelector(store, (snapshot) =>
    selector(snapshot as SnapshotOfItem<I> | null),
  );
}
