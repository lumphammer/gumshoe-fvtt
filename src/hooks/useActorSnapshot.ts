import { useMemo } from "react";

import type { SnapshotStore } from "../module/snapshots/createSnapshotStore";
import { nullStore } from "../module/snapshots/createSnapshotStore";
import type {
  ActorSnapshot,
  SettingsSnapshot,
} from "../module/snapshots/documentStores";
import {
  getActorStore,
  getSettingsStore,
} from "../module/snapshots/documentStores";
import type { SnapshotOfActor } from "../module/snapshots/snapshotTypes";
import { useSnapshotSelector, useStoresSelector } from "./useSnapshot";

export type { ActorSnapshot, SnapshotOfActor };

const storeOf = (actor: Actor.Implementation | null): SnapshotStore<unknown> =>
  actor ? getActorStore(actor) : nullStore;

/**
 * Something from an immutable snapshot of an actor (with its items and
 * effects), typed from the actor's type (a `PCActor`'s has a PC's system
 * data), or `null` if the actor can be null and is. Re-renders only when the
 * selector's result changes, so e.g. a weapon can follow its ability without
 * re-rendering for every other item on the actor (see `useSnapshotSelector`).
 */
export function useActorSnapshot<A extends Actor.Implementation | null, R>(
  actor: A,
  selector: (actor: SnapshotOfActor<A>) => R,
): R {
  return useSnapshotSelector(storeOf(actor), (snapshot) =>
    selector(snapshot as SnapshotOfActor<A>),
  );
}

/**
 * Like `useActorSnapshot`, with our settings too: for working something out
 * from both (e.g. a rule over the actor which depends on the settings), and
 * re-rendering only when the result changes, rather than for every change to
 * any setting.
 */
export function useActorAndSettings<A extends Actor.Implementation | null, R>(
  actor: A,
  selector: (actor: SnapshotOfActor<A>, settings: SettingsSnapshot) => R,
): R {
  const actorStore = storeOf(actor);
  const stores = useMemo(
    () => [actorStore, getSettingsStore() as SnapshotStore<unknown>],
    [actorStore],
  );
  return useStoresSelector(stores, ([snapshot, settings]) =>
    selector(snapshot as SnapshotOfActor<A>, settings as SettingsSnapshot),
  );
}
