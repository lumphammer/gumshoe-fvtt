import type { SnapshotStore } from "../module/snapshots/createSnapshotStore";
import { nullStore } from "../module/snapshots/createSnapshotStore";
import { getCombatStore } from "../module/snapshots/documentStores";
import type { CombatSnapshot } from "../module/snapshots/snapshotTypes";
import { useSnapshotSelector } from "./useSnapshot";

export type { CombatSnapshot };

/**
 * Something from an immutable snapshot of a combat (with its combatants and
 * turn order), or `null` for no combat. Re-renders only when the selector's
 * result changes (see `useSnapshotSelector`).
 */
export function useCombatSnapshot<R>(
  combat: Combat.Implementation | null,
  selector: (combat: CombatSnapshot | null) => R,
): R {
  const store: SnapshotStore<unknown> = combat
    ? getCombatStore(combat)
    : nullStore;
  return useSnapshotSelector(store, (snapshot) =>
    selector(snapshot as CombatSnapshot | null),
  );
}
