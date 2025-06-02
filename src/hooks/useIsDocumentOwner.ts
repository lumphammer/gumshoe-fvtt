import { useMemo } from "react";

import { assertGame } from "../functions/isGame";
import { useDocumentSheetContext } from "./useSheetContexts";

/**
 * Check if the current user is the owner of the document.
 *
 * If we ever need to use this in a non-document-sheet context, it would
 * probably be better to create a new react context
 */
export function useIsDocumentOwner() {
  assertGame(game);
  const { doc } = useDocumentSheetContext();

  const isOwner = useMemo(() => {
    return doc.testUserPermission(
      game.user,
      CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
    );
  }, [doc]);

  return isOwner;
}
