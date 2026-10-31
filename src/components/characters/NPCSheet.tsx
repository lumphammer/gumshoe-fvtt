import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext } from "react";

import { assertGame } from "../../functions/isGame";
import { useIsDocumentLimited } from "../../hooks/useIsDocumentLimited";
import { getIsEditable, IsEditableContext } from "../../hooks/useIsEditable";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertNPCActor } from "../../module/actors/npc";
import { NPCSheetFull } from "./NPCSheetFull";
import { NPCSheetSimple } from "./NPCSheetSimple";

export const NPCSheet = () => {
  const { actor } = useActorSheetContext();
  const app = useContext(FoundryAppContext);

  assertNPCActor(actor);
  assertGame(game);

  const isLimited = useIsDocumentLimited();

  // this re-renders whenever Foundry renders the sheet (e.g. when its
  // ownership changes); provided, so memoised parts' inputs follow it
  return (
    <IsEditableContext.Provider value={getIsEditable(app)}>
      {isLimited ? <NPCSheetSimple /> : <NPCSheetFull />}
    </IsEditableContext.Provider>
  );
};

NPCSheet.displayName = "NPCSheet";
