import { useMemo, useState } from "react";

import { nullStore } from "../module/snapshots/createSnapshotStore";
import type { ActorSnapshot } from "../module/snapshots/documentStores";
import {
  getActorStore,
  getWorldActorsStore,
} from "../module/snapshots/documentStores";
import { useSnapshotSelector, useStoresSelector } from "./useSnapshot";

type ActorsSelector<R> = (actors: readonly (ActorSnapshot | null)[]) => R;

/**
 * Something from the snapshots of several world actors, looked up by id (e.g.
 * a party's members), with `null` for an id with no actor. Like
 * `useActorSnapshot`, but for a list: it follows each actor's changes, and
 * the actors being created or deleted. Re-renders only when the selector's
 * result changes, so it can build objects (see `useSnapshotSelector`).
 *
 * The selector can use values from the component (it runs again on every
 * render), but must be a pure function of them and the snapshots.
 */
export function useActorsSnapshot<R>(
  ids: readonly string[],
  selector: ActorsSelector<R>,
): R {
  // a new list whenever an actor is created or deleted, so the stores below
  // are looked up again
  const worldIds = useSnapshotSelector(getWorldActorsStore(), (actors) =>
    actors.map((actor) => actor.id),
  );
  const key = ids.join("\n");
  const stores = useMemo(
    () =>
      (key === "" ? [] : key.split("\n")).map((id) => {
        const actor = worldIds.includes(id) ? game.actors?.get(id) : undefined;
        return actor ? getActorStore(actor) : nullStore;
      }),
    [key, worldIds],
  );
  return useStoresSelector(stores, (snapshots) =>
    selector(snapshots as readonly (ActorSnapshot | null)[]),
  );
}

/**
 * Something from the snapshots of a list of actors (any: e.g. tokens'
 * synthetic actors), with `null` for a missing one. Like `useActorsSnapshot`,
 * for actors the caller has looked up itself: it follows their changes, but
 * not which actors they are, so look them up again when that might change.
 */
export function useActorListSnapshot<R>(
  actors: readonly (Actor.Implementation | null)[],
  selector: ActorsSelector<R>,
): R {
  // the same stores while the actors are the same ones (kept as state, and
  // replaced during render when they change: React allows that)
  const storesFor = (list: readonly (Actor.Implementation | null)[]) => ({
    actors: list,
    stores: list.map((actor) => (actor ? getActorStore(actor) : nullStore)),
  });
  const [cache, setCache] = useState(() => storesFor(actors));
  let current = cache;
  if (
    cache.actors.length !== actors.length ||
    cache.actors.some((actor, i) => actor !== actors[i])
  ) {
    current = storesFor(actors);
    setCache(current);
  }
  return useStoresSelector(current.stores, (snapshots) =>
    selector(snapshots as readonly (ActorSnapshot | null)[]),
  );
}
