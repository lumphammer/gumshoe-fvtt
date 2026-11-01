import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext } from "react";

import { assertGame } from "../functions/isGame";
import { useActorSnapshot } from "./useActorSnapshot";
import { useItemSelector } from "./useItemSnapshot";
import { getIsEditable } from "./useIsEditable";

type SheetPermissions = {
  isEditable: boolean;
  isLimited: boolean;
};

const getSheetPermissions = (
  doc: Actor.Implementation | Item.Implementation,
  app: unknown,
): SheetPermissions => {
  assertGame(game);
  return {
    isEditable: getIsEditable(app),
    isLimited: doc.testUserPermission(
      game.user,
      CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
      { exact: true },
    ),
  };
};

// These read the live document, but inside a snapshot selector: that runs
// again on every change to the document and on every render, so nothing can
// keep a stale answer. Worked out in the component instead, a memo keyed on
// the document or the app (such as React Compiler's) would, because neither
// changes identity when the ownership does.

/**
 * What the user may do with an item, for the root of a sheet which reads it
 * through snapshots: whether they can edit it (to provide through
 * `IsEditableContext`), and whether they only have Limited permission.
 *
 * Follows the item's ownership, and its actor's (an item on an actor has the
 * actor's permissions).
 */
export function useSheetPermissions(
  item: Item.Implementation,
): SheetPermissions {
  const app = useContext(FoundryAppContext);
  // its result is in the item's: this only re-renders when it changes
  useActorSnapshot(item.actor, (actor) => actor?.ownership ?? null);
  return useItemSelector(item, () => getSheetPermissions(item, app));
}

/**
 * What the user may do with an actor, for the root of a sheet which reads it
 * through snapshots (as `useSheetPermissions` does for items). Follows the
 * actor's ownership.
 */
export function useActorSheetPermissions(
  actor: Actor.Implementation,
): SheetPermissions {
  const app = useContext(FoundryAppContext);
  return useActorSnapshot(actor, () => getSheetPermissions(actor, app));
}
