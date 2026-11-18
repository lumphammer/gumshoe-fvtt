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
 * How long a store keeps watching after it was read with nothing subscribed,
 * or after its last subscriber left, in ms.
 */
export const watchGraceMs = 5000;

/**
 * A store for `useSyncExternalStore` that holds an immutable snapshot of some
 * mutable data, structurally shared from one change to the next, so anything
 * that didn't change keeps its identity and memoised components can skip it.
 *
 * It watches while something is subscribed, and for a while
 * (`watchGraceMs`) after being read with nothing subscribed, or after its
 * last subscriber leaves. A sheet's first render reads its stores before
 * anything has subscribed (React subscribes after committing), so this makes
 * every component that mounts share one read, rather than each reading all
 * the data again; and a tab switch or a sheet reopened soon after reads
 * nothing. A store that stopped watching reads again when it's next read or
 * subscribed to, so how long it waits doesn't matter for being up to date.
 *
 * @param read returns a fresh copy of the data (never the live object, which
 * would then be shared with, and mutated under, the snapshot).
 * @param watch starts listening for changes, calling `onChange` whenever the
 * data might have changed, and returns a function that stops listening.
 */
export function createSnapshotStore<T>(
  read: () => T,
  watch: (onChange: OnChange<T>) => () => void,
): SnapshotStore<T> {
  let snapshot = read() as DeepReadonly<T>;
  const listeners = new Set<() => void>();
  let unwatch: (() => void) | null = null;
  let graceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Move to the next data, and tell the listeners if anything changed. */
  const change = (next: T, notify: boolean) => {
    const shared = replaceEqualDeep(snapshot, next as DeepReadonly<T>);
    if (shared === snapshot) return;
    snapshot = shared;
    if (notify) listeners.forEach((listener) => listener());
  };

  /**
   * Start watching, if it isn't already. `catchUp` reads again first, for
   * anything that changed while nothing was watching.
   */
  const startWatching = (catchUp: boolean) => {
    if (unwatch !== null) return;
    if (catchUp) change(read(), false);
    unwatch = watch((update) => {
      change(update ? update(snapshot) : read(), true);
    });
  };

  /** Stop watching in a while, unless something has subscribed by then. */
  const stopWatchingLater = () => {
    if (graceTimer !== null) clearTimeout(graceTimer);
    graceTimer = setTimeout(() => {
      graceTimer = null;
      if (listeners.size === 0 && unwatch !== null) {
        unwatch();
        unwatch = null;
      }
    }, watchGraceMs);
  };

  // it was just read, so watch from now
  startWatching(false);
  stopWatchingLater();

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      startWatching(true);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stopWatchingLater();
      };
    },
    getSnapshot: () => {
      if (listeners.size === 0) {
        startWatching(true);
        // (once per grace period: a first render reads many times)
        if (graceTimer === null) stopWatchingLater();
      }
      return snapshot;
    },
  };
}

/** A store of `null`, for when there's no document to snapshot. */
export const nullStore: SnapshotStore<null> = createSnapshotStore(
  () => null,
  () => () => undefined,
);
