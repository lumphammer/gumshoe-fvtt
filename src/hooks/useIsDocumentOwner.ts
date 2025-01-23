import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext, useMemo } from "react";

import { assertGame } from "../functions/utilities";

/**
 * Check if the current user is the owner of the document.
 *
 * If we ever need to use this in a non-document-sheet context, it would
 * probably be better to create a new react context
 */
export function useIsDocumentOwner() {
  assertGame(game);

  const application = useContext(FoundryAppContext);
  const user = game.user;

  const isOwner = useMemo(() => {
    if (
      (application instanceof DocumentSheet ||
        application instanceof foundry.applications.api.DocumentSheetV2) &&
      user
    ) {
      return application.document.testUserPermission(
        game.user,
        CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER,
      );
    } else {
      return false;
    }
  }, [application, user]);

  return isOwner;
}
