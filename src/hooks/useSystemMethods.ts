import { useMemo } from "react";

type Methods<T> = {
  [
    K in keyof T as T[K] extends (...args: never[]) => unknown ? K : never
  ]: T[K];
};

/**
 * The methods of a document's system data (setters and so on), as functions
 * whose identity never changes. Foundry can replace `doc.system` when the
 * document updates, so passing `doc.system.setFoo` to a memoised component
 * would make it re-render every time; these call whatever `doc.system` is when
 * they're called.
 */
export function useSystemMethods<TSystem extends object>(doc: {
  system: TSystem;
}): Methods<TSystem> {
  return useMemo(() => {
    const cache = new Map<PropertyKey, unknown>();
    return new Proxy({} as Methods<TSystem>, {
      get: (_target, key) => {
        if (!cache.has(key)) {
          cache.set(key, (...args: unknown[]) =>
            (
              doc.system as unknown as Record<
                PropertyKey,
                (...args: unknown[]) => unknown
              >
            )[key](...args),
          );
        }
        return cache.get(key);
      },
    });
  }, [doc]);
}
