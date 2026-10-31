import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

import { useRefStash } from "../../hooks/useRefStash";

export interface ItemWithTransitionState<Item> {
  /** The original item from the source list */
  item: Item;
  /**
   * If true, the item should be at, or headed towards its "fully visible"
   * state
   */
  isShowing: boolean;
  /**
   * This only matters when `isShowing` is false. If true, the item is newly
   * added and should have its "off stage, about to enter" state. If false,
   * the item is leaving and should have its "on stage, about to leave" state.
   */
  isEntering: boolean;
  /**
   * The unique identifier for this item. This is the result of calling the
   * `getKey` function on the item.
   */
  key: string;
}

/**
 * A simple hook to manage the transition state of a list of items.
 */
export function useListShowHideTransition<Item>(
  /**
   * The source list - what you would normally pass to a `map` function if you
   * were not using this hook.
   */
  externallList: readonly Item[],
  /**
   * A function which returns a unique identifier for each item in the list.
   * This is needed because we need to be able to track items as they enter and
   * leave the list.
   *
   * We cannot use the index of the item in the list because items can be added
   * and removed from the list, so the index of an item can change. We cannot
   * use object equality because the source data may be modified in an immutable
   * way, breaking `===` equality.
   *
   * You were going to have decent object keys anyway, weren't you?
   */
  getKey: (item: Item) => string,
  /**
   * The time in milliseconds that the exit transition should take.
   */
  exitAfterMs: number,
  enterAfterMs = 0,
) {
  // this is internally managed list of items, including items which have left
  // the master list but are still exiting.
  const [internalList, setInternalList] = useState<
    ItemWithTransitionState<Item>[]
  >(
    externallList.map((item) => ({
      item,
      isShowing: true,
      isEntering: true,
      key: getKey(item),
    })),
  );

  // these refs are to prevent the effect triggering too often - we only want it
  // to run when the external (i.e. from props) list changes
  const internalListRef = useRefStash(internalList);
  const getKeyRef = useRefStash(getKey);
  const exitAfterMsRef = useRefStash(exitAfterMs);
  const enterAfterMsRef = useRefStash(enterAfterMs);

  // this effect is where the bulk of the work happens
  useEffect(() => {
    const newInternalList = [...internalListRef.current];

    const keysToRemove: string[] = [];
    const keysToEnter: string[] = [];

    const getKey = getKeyRef.current;

    // for each item in old list
    for (const [i, oldItem] of newInternalList.entries()) {
      const externalItem = externallList.find(
        (item) => getKey(item) === oldItem.key,
      );
      // if it exists in new list
      if (externalItem) {
        // update it
        newInternalList[i] = {
          ...oldItem,
          item: externalItem,
          isShowing: oldItem.isEntering ? oldItem.isShowing : true,
          isEntering: true,
        };
        // if it does not exist in new list
      } else {
        // set it to exiting
        newInternalList[i] = {
          ...oldItem,
          isShowing: false,
          isEntering: false,
        };
        // add it to a list to be removed
        keysToRemove.push(oldItem.key);
      }
    }

    // for each item in new list
    let neighbourKey: string | null = null;
    for (const externalItem of externallList) {
      const externalKey = getKey(externalItem);
      // if it does not exist in old list
      if (
        !internalListRef.current.some(
          (internalItem) => internalItem.key === externalKey,
        )
      ) {
        // add it to a list to be added
        keysToEnter.push(externalKey);
        // add it to the list just after its neighbour with startEntering state
        const indexOfNeighbour =
          neighbourKey === null
            ? -1
            : newInternalList.findIndex(
                ({ key: internaItemKey }) => internaItemKey === neighbourKey,
              );
        const newItem: ItemWithTransitionState<Item> = {
          item: externalItem,
          isShowing: false,
          isEntering: true,
          key: externalKey,
        };
        newInternalList.splice(indexOfNeighbour + 1, 0, newItem);
      }
      neighbourKey = externalKey;
    }

    // update the state
    // flushSync is needed in React 18+ to avoid automatic batching. without it,
    // the state update will be batched with the timeout below, so we will not
    // see the items render in their "out" state.
    // see https://github.com/reactwg/react-18/discussions/21
    // requestAnimationFrame is needed because flushSync cannot run inside a
    // hook.
    setTimeout(() => {
      flushSync(() => {
        setInternalList(newInternalList);
      });
    }, 0);

    // if there are any items in the "remove" list
    if (keysToRemove.length > 0) {
      // set a timeout to remove them
      setTimeout(() => {
        setInternalList((internalList) => {
          const filteredList = internalList.filter(
            (internalItem) =>
              !(
                keysToRemove.includes(internalItem.key) &&
                !internalItem.isEntering
              ),
          );
          return filteredList;
        });
      }, exitAfterMsRef.current);
    }

    // if the "new items" list is not empty
    if (keysToEnter.length > 0) {
      // set a timeout to start them entering
      setTimeout(() => {
        setInternalList((internalList) => {
          const mappedList = internalList.map((internalItem) => {
            if (keysToEnter.includes(internalItem.key)) {
              return {
                ...internalItem,
                isShowing: true,
              };
            } else {
              return internalItem;
            }
          });
          return mappedList;
        });
      }, enterAfterMsRef.current);
    }
  }, [
    externallList,
    getKeyRef,
    internalListRef,
    exitAfterMsRef,
    enterAfterMsRef,
  ]);

  return internalList;
}
