import { IsEditableContext } from "../../hooks/useIsEditable";
import { useActorSheetPermissions } from "../../hooks/useSheetPermissions";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { PCSheetFull } from "./PCSheetFull";
import { PCSheetSimple } from "./PCSheetSimple";

export const PCSheet = () => {
  "use memo";

  const { actor } = useActorSheetContext();
  const { isEditable, isLimited } = useActorSheetPermissions(actor);
  // Foundry's render doesn't reach React here (the sheet keeps itself
  // current): this follows the actor's ownership, and provides it, so
  // memoised parts' inputs follow it
  return (
    <IsEditableContext.Provider value={isEditable}>
      {isLimited ? <PCSheetSimple /> : <PCSheetFull />}
    </IsEditableContext.Provider>
  );
};

PCSheet.displayName = "PCSheet";
