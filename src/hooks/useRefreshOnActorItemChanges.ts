import { useEffect, useReducer } from "react";

/**
 * Re-render when any item on this actor is created, updated, or deleted.
 *
 * An item sheet only re-renders when its own item changes, but some show data
 * from the actor's other items (e.g. a weapon's attack panel shows its
 * ability's pool).
 */
export function useRefreshOnActorItemChanges(actor: Actor | null) {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    if (actor === null) return;
    const callback = (item: Item) => {
      if (item.parent === actor) {
        forceUpdate();
      }
    };
    const hookNames = ["createItem", "updateItem", "deleteItem"] as const;
    const ids = hookNames.map((hookName) => Hooks.on(hookName, callback));
    return () => {
      hookNames.forEach((name, i) => Hooks.off(name, ids[i]));
    };
  }, [actor]);
}
