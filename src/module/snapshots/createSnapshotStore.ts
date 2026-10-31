import { replaceEqualDeep } from "./replaceEqualDeep";

/** `T`, with every property and array read-only, all the way down. */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

export interface SnapshotStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => DeepReadonly<T>;
}

/**
 * Called by a store's `watch` function when the data might have changed: with
 * no argument to re-read all of it, or with a function that makes the next
 * data from the current snapshot (e.g. replacing just the item that changed).
 */
export type OnChange<T> = (update?: (previous: DeepReadonly<T>) => T) => void;

/**
 * A store for `useSyncExternalStore` that holds an immutable snapshot of some
 * mutable data, structurally shared from one change to the next, so anything
 * that didn't change keeps its identity and memoised components can skip it.
 *
 * @param read returns a fresh copy of the data (never the live object, which
 * would then be shared with, and mutated under, the snapshot).
 * @param watch starts listening for changes, calling `onChange` whenever the
 * data might have changed, and returns a function that stops listening. It's
 * only called while something is subscribed.
 */
export function createSnapshotStore<T>(
  read: () => T,
  watch: (onChange: OnChange<T>) => () => void,
): SnapshotStore<T> {
  let snapshot = read() as DeepReadonly<T>;
  const listeners = new Set<() => void>();
  let unwatch: (() => void) | null = null;

  /** Move to the next data, and tell the listeners if anything changed. */
  const change = (next: T, notify: boolean) => {
    const shared = replaceEqualDeep(snapshot, next as DeepReadonly<T>);
    if (shared === snapshot) return;
    snapshot = shared;
    if (notify) listeners.forEach((listener) => listener());
  };

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      if (unwatch === null) {
        // catch up on anything that changed while nothing was watching (React
        // checks the snapshot again after subscribing)
        change(read(), false);
        unwatch = watch((update) => {
          change(update ? update(snapshot) : read(), true);
        });
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && unwatch !== null) {
          unwatch();
          unwatch = null;
        }
      };
    },
    getSnapshot: () => {
      // nothing is watching, so it may be out of date (a store can sit
      // unwatched between one component unmounting and another mounting)
      if (unwatch === null) change(read(), false);
      return snapshot;
    },
  };
}

/** A store of `null`, for when there's no document to snapshot. */
export const nullStore: SnapshotStore<null> = createSnapshotStore(
  () => null,
  () => () => undefined,
);
