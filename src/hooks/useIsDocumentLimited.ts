import { assertGame } from "../functions/isGame";
import { useDocumentSheetContext } from "./useSheetContexts";

/**
 * Check if the current user has limited access to the document.
 *
 * Not memoised: the document is the same object when its ownership changes,
 * so a memo keyed on it would never notice. It's a cheap check.
 */
export function useIsDocumentLimited() {
  assertGame(game);
  const { doc } = useDocumentSheetContext();

  return doc.testUserPermission(
    game.user,
    CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
    {
      exact: true,
    },
  );
}
