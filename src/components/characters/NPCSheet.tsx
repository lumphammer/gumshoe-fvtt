import { assertGame } from "../../functions/isGame";
import { IsEditableContext } from "../../hooks/useIsEditable";
import { useActorSheetPermissions } from "../../hooks/useSheetPermissions";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertNPCActor } from "../../module/actors/npc";
import { NPCSheetFull } from "./NPCSheetFull";
import { NPCSheetSimple } from "./NPCSheetSimple";

export const NPCSheet = () => {
  "use memo";

  const { actor } = useActorSheetContext();

  assertNPCActor(actor);
  assertGame(game);

  const { isEditable, isLimited } = useActorSheetPermissions(actor);

  // Foundry's render doesn't reach React here (the sheet keeps itself
  // current): this follows the actor's ownership, and provides it, so
  // memoised parts' inputs follow it
  return (
    <IsEditableContext.Provider value={isEditable}>
      {isLimited ? <NPCSheetSimple /> : <NPCSheetFull />}
    </IsEditableContext.Provider>
  );
};

NPCSheet.displayName = "NPCSheet";
