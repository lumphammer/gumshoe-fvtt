import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import { useContext } from "react";

import { useIsDocumentLimited } from "../../hooks/useIsDocumentLimited";
import { getIsEditable, IsEditableContext } from "../../hooks/useIsEditable";
import { PCSheetFull } from "./PCSheetFull";
import { PCSheetSimple } from "./PCSheetSimple";

export const PCSheet = () => {
  const app = useContext(FoundryAppContext);
  const isLimited = useIsDocumentLimited();
  // this re-renders whenever Foundry renders the sheet (e.g. when its
  // ownership changes); provided, so memoised parts' inputs follow it
  return (
    <IsEditableContext.Provider value={getIsEditable(app)}>
      {isLimited ? <PCSheetSimple /> : <PCSheetFull />}
    </IsEditableContext.Provider>
  );
};

PCSheet.displayName = "PCSheet";
