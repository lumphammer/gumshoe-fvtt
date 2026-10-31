import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext } from "react";

import { assertGame } from "../functions/isGame";
import { useActorSnapshot } from "./useActorSnapshot";
import { useItemSelector } from "./useItemSnapshot";
import { getIsEditable } from "./useIsEditable";

/**
 * What the user may do with an item, for the root of a sheet which reads it
 * through snapshots: whether they can edit it (to provide through
 * `IsEditableContext`), and whether they only have Limited permission.
 *
 * Re-renders when the item's ownership changes, or its actor's (an item on an
 * actor has the actor's permissions).
 */
export function useSheetPermissions(item: Item.Implementation): {
  isEditable: boolean;
  isLimited: boolean;
} {
  assertGame(game);
  useItemSelector(item, (snapshot) => snapshot.ownership);
  useActorSnapshot(item.actor, (actor) => actor?.ownership ?? null);
  const app = useContext(FoundryAppContext);
  return {
    isEditable: getIsEditable(app),
    isLimited: item.testUserPermission(
      game.user,
      CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
      { exact: true },
    ),
  };
}
