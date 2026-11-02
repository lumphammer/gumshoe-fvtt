import { useMemo, useRef, useSyncExternalStore } from "react";

import { nullStore } from "../module/snapshots/createSnapshotStore";
import type { ActorSnapshot } from "../module/snapshots/documentStores";
import {
  getActorStore,
  getWorldActorsStore,
} from "../module/snapshots/documentStores";
import { replaceEqualDeep } from "../module/snapshots/replaceEqualDeep";
import { useSnapshotSelector } from "./useSnapshot";

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
export function useActorsSnapshot<R, TSystem = unknown>(
  ids: readonly string[],
  selector: (actors: readonly (ActorSnapshot<TSystem> | null)[]) => R,
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
        return actor ? getActorStore<TSystem>(actor) : nullStore;
      }),
    [key, worldIds],
  );
  const subscribe = useMemo(
    () => (listener: () => void) => {
      const offs = stores.map((store) => store.subscribe(listener));
      return () => offs.forEach((off) => off());
    },
    [stores],
  );
  const last = useRef<{ result: R } | null>(null);
  const getSelection = () => {
    const result = replaceEqualDeep(
      last.current?.result,
      selector(stores.map((store) => store.getSnapshot())),
    );
    last.current = { result };
    return result;
  };
  return useSyncExternalStore(subscribe, getSelection);
}
