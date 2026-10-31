import { useMemo } from "react";

import { nullStore } from "../module/snapshots/createSnapshotStore";
import type { ActorSnapshot } from "../module/snapshots/documentStores";
import { createActorStore } from "../module/snapshots/documentStores";
import { useSnapshotSelector } from "./useSnapshot";

export type { ActorSnapshot };

/**
 * Something from an immutable snapshot of an actor (with its items and
 * effects), or `null` for no actor. Re-renders only when the selector's result
 * changes, so e.g. a weapon can follow its ability without re-rendering for
 * every other item on the actor (see `useSnapshotSelector`).
 */
export function useActorSnapshot<R, TSystem = unknown>(
  actor: Actor.Implementation | null,
  selector: (actor: ActorSnapshot<TSystem> | null) => R,
): R {
  const store = useMemo(
    () => (actor ? createActorStore<TSystem>(actor) : nullStore),
    [actor],
  );
  return useSnapshotSelector<unknown, R>(store, (snapshot) =>
    selector(snapshot as ActorSnapshot<TSystem> | null),
  );
}
