import { useMemo, useSyncExternalStore } from "react";

import type { DeepReadonly } from "../module/snapshots/createSnapshotStore";
import { createSnapshotStore } from "../module/snapshots/createSnapshotStore";

/**
 * An immutable snapshot of an item's prepared data (`toObject(false)`), with
 * its system data typed as `TSystem`.
 */
export type ItemSnapshot<TSystem> = DeepReadonly<ItemData<TSystem>>;

type ItemData<TSystem> = Omit<Item.Source, "system"> & { system: TSystem };

/**
 * An immutable snapshot of an item, which changes (sharing whatever didn't
 * change) whenever the item or its effects do. Memoised components given parts
 * of it re-render only when those parts change.
 *
 * Write through the item itself (e.g. `item.update`), not the snapshot.
 */
export function useItemSnapshot<TSystem>(
  item: Item.Implementation,
): ItemSnapshot<TSystem> {
  const store = useMemo(
    () =>
      createSnapshotStore(
        () => item.toObject(false) as unknown as ItemData<TSystem>,
        (onChange) => {
          const onItem = (doc: Item.Implementation) => {
            if (doc === item) onChange();
          };
          const onEffect = (effect: ActiveEffect.Implementation) => {
            if (effect.parent === item) onChange();
          };
          const ids = {
            updateItem: Hooks.on("updateItem", onItem),
            createActiveEffect: Hooks.on("createActiveEffect", onEffect),
            updateActiveEffect: Hooks.on("updateActiveEffect", onEffect),
            deleteActiveEffect: Hooks.on("deleteActiveEffect", onEffect),
          };
          return () => {
            Hooks.off("updateItem", ids.updateItem);
            Hooks.off("createActiveEffect", ids.createActiveEffect);
            Hooks.off("updateActiveEffect", ids.updateActiveEffect);
            Hooks.off("deleteActiveEffect", ids.deleteActiveEffect);
          };
        },
      ),
    [item],
  );
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
