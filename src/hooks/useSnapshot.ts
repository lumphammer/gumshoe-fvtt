import { useRef, useSyncExternalStore } from "react";

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
 * Part of a store's snapshot, or something worked out from it. Re-renders only
 * when the result changes: it's structurally shared with the last one, so a
 * selector can build new objects or arrays and still keep their identity when
 * their contents are the same.
 *
 * The selector can use values from the component (it runs again on every
 * render), but must be a pure function of them and the snapshot.
 */
export function useSnapshotSelector<T, R>(
  store: SnapshotStore<T>,
  selector: (snapshot: DeepReadonly<T>) => R,
): R {
  const last = useRef<{ result: R } | null>(null);
  const getSelection = () => {
    const result = replaceEqualDeep(
      last.current?.result,
      selector(store.getSnapshot()),
    );
    last.current = { result };
    return result;
  };
  return useSyncExternalStore(store.subscribe, getSelection);
}
