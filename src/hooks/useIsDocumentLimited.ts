import { useMemo } from "react";

import { assertGame } from "../functions/isGame";
import { useDocumentSheetContext } from "./useSheetContexts";

/**
 * Check if the current user has limited access to the document.
 *
 */
export function useIsDocumentLimited() {
  assertGame(game);
  const { doc } = useDocumentSheetContext();

  const isLimited = useMemo(() => {
    return doc.testUserPermission(
      game.user,
      CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
      { exact: true },
    );
  }, [doc]);

  return isLimited;
}
