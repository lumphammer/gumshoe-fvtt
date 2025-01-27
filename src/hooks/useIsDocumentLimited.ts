import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext, useMemo } from "react";

import { assertGame } from "../functions/utilities";

/**
 * Check if the current user has limited access to the document.
 *
 */
export function useIsDocumentLimited() {
  assertGame(game);

  const application = useContext(FoundryAppContext);
  const user = game.user;

  const isLimited = useMemo(() => {
    if (application instanceof DocumentSheet && user) {
      return application.document.testUserPermission(
        game.user,
        CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED,
        // we care about *exactly* limited access, not "limited or better"
        { exact: true },
      );
    } else {
      return false;
    }
  }, [application, user]);

  return isLimited;
}
