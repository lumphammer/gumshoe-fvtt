import { InvestigatorActor } from "../module/actors/InvestigatorActor";
import { InvestigatorItem } from "../module/items/InvestigatorItem";
import { nullStore } from "../module/snapshots/createSnapshotStore";
import {
  getActorStore,
  getItemStore,
} from "../module/snapshots/documentStores";
import { assertGame } from "../functions/isGame";
import { useActorSnapshot } from "./useActorSnapshot";
import { useSnapshotSelector } from "./useSnapshot";
import { useDocumentSheetContext } from "./useSheetContexts";

/**
 * Whether the current user owns the sheet's document. Follows its ownership
 * (and, for an item on an actor, the actor's): the check runs in a snapshot
 * selector, which runs again on every change to the document and every render.
 *
 * If we ever need to use this in a non-document-sheet context, it would
 * probably be better to create a new react context
 */
export function useIsDocumentOwner() {
  const { doc } = useDocumentSheetContext();
  const actor =
    doc instanceof InvestigatorActor
      ? doc
      : doc instanceof InvestigatorItem
        ? doc.actor
        : null;
  const item = doc instanceof InvestigatorItem ? doc : null;
  // an item's result is in its actor's: this only re-renders when it changes
  useActorSnapshot(item ? actor : null, (actor) => actor?.ownership ?? null);
  return useSnapshotSelector<unknown, boolean>(
    item ? getItemStore(item) : actor ? getActorStore(actor) : nullStore,
    () => {
      assertGame(game);
      return doc.testUserPermission(
        game.user,
        CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
      );
    },
  );
}
