import { useMemo, useRef, useSyncExternalStore } from "react";

import type {
  DeepReadonly,
  SnapshotStore,
} from "../module/snapshots/createSnapshotStore";
import { replaceEqualDeep } from "../module/snapshots/replaceEqualDeep";

/** A store's whole snapshot. Re-renders whenever any of it changes. */
export function useSnapshot<T>(store: SnapshotStore<T>): DeepReadonly<T> {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

/**
 * Something worked out from several stores' snapshots (in the same order).
 * Re-renders only when the result changes: it's structurally shared with the
 * last one, so a selector can build new objects or arrays and still keep their
 * identity when their contents are the same. `stores` must keep its identity
 * while the stores are the same, or it resubscribes on every render.
 *
 * The selector can use values from the component (it runs again on every
 * render), but must be a pure function of them and the snapshots.
 */
export function useStoresSelector<R>(
  stores: readonly SnapshotStore<unknown>[],
  selector: (snapshots: readonly unknown[]) => R,
): R {
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

/**
 * Part of a store's snapshot, or something worked out from it. Like
 * `useStoresSelector`, for one store.
 */
export function useSnapshotSelector<T, R>(
  store: SnapshotStore<T>,
  selector: (snapshot: DeepReadonly<T>) => R,
): R {
  const stores = useMemo(() => [store as SnapshotStore<unknown>], [store]);
  return useStoresSelector(stores, ([snapshot]) =>
    selector(snapshot as DeepReadonly<T>),
  );
}
