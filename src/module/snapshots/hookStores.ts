// Stores of values read from Foundry (documents, settings, the game's state),
// which follow the hooks that say they may have changed. The Foundry glue for
// `createSnapshotStore`: anything a compiled component shows from outside its
// own props and snapshots should come through one of these, rather than a hook
// that forces a re-render (see docs/immutable-data.md).

import type { SnapshotStore } from "./createSnapshotStore";
import { createSnapshotStore } from "./createSnapshotStore";

export type Off = () => void;

/** Listen to a hook until the returned function is called. */
export function on<K extends Hooks.HookName>(
  hook: K,
  fn: Hooks.Function<K>,
): Off {
  const id = Hooks.on(hook, fn);
  return () => Hooks.off(hook, id);
}

/** A hook to follow, and which of its calls might change what's read */
export type HookWatch = {
  hook: Hooks.HookName;
  when?: (...args: never[]) => boolean;
};

/**
 * Follow a hook: on every call, or only those `when` says might change what's
 * read (e.g. only updates to one document).
 */
export const onHook = <K extends Hooks.HookName>(
  hook: K,
  when?: (...args: Parameters<Hooks.Function<K>>) => boolean,
): HookWatch => ({ hook, when: when as HookWatch["when"] });

/** Listen to some hooks, calling `onChange` when they say to. */
export function watchHooks(hooks: readonly HookWatch[], onChange: () => void) {
  const offs = hooks.map(({ hook, when }) =>
    on(hook, ((...args: never[]) => {
      if (when === undefined || when(...args)) onChange();
    }) as Hooks.Function<typeof hook>),
  );
  return () => offs.forEach((off) => off());
}

/**
 * A store of a value read from Foundry, read again whenever one of `hooks`
 * fires (and `when` agrees), and structurally shared, so it keeps its identity
 * while it reads the same. `read` must return a fresh copy, or plain values,
 * never something Foundry will go on to change in place.
 */
export function createHookStore<T>(
  read: () => T,
  hooks: readonly HookWatch[],
): SnapshotStore<T> {
  return createSnapshotStore(read, (onChange) =>
    watchHooks(hooks, () => onChange()),
  );
}

/**
 * A number which goes up whenever one of `hooks` fires (and `when` agrees):
 * for something which can't be copied into a store (e.g. which token's actor a
 * target is), so that a component which reads it live re-renders when it
 * might have changed.
 */
export function createHookCounter(
  hooks: readonly HookWatch[],
): SnapshotStore<number> {
  let count = 0;
  return createSnapshotStore(
    () => count,
    (onChange) =>
      watchHooks(hooks, () => {
        count += 1;
        onChange();
      }),
  );
}

/**
 * A function which creates the thing on its first call and returns the same
 * one from then on: for stores of the game's state, which can't be read until
 * the game is ready.
 */
export function once<T>(create: () => T): () => T {
  let made: { value: T } | null = null;
  return () => {
    made ??= { value: create() };
    return made.value;
  };
}

/**
 * A function which creates a thing for each key on first asking, and returns
 * the same one for that key after: one store per document, shared by
 * everything that reads it. Weak, so it goes when the document does.
 */
export function cachedPer<K extends object, V>(
  create: (key: K) => V,
): (key: K) => V {
  const cache = new WeakMap<K, V>();
  return (key) => {
    let value = cache.get(key);
    if (value === undefined) {
      value = create(key);
      cache.set(key, value);
    }
    return value;
  };
}
