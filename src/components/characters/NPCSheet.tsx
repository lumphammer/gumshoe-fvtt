import { assertGame } from "../../functions/isGame";
import { useSheetPermissions } from "../../hooks/useSheetPermissions";
import { SheetPermissionsContext } from "../../hooks/useIsEditable";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertNPCActor } from "../../module/actors/npc";
import { NPCSheetFull } from "./NPCSheetFull";
import { NPCSheetSimple } from "./NPCSheetSimple";

export const NPCSheet = () => {
  "use memo";

  const { actor } = useActorSheetContext();

  assertNPCActor(actor);
  assertGame(game);

  const permissions = useSheetPermissions(actor);

  // Foundry's render doesn't reach React here (the sheet keeps itself
  // current): this follows the actor's ownership, and provides it, so
  // memoised parts' inputs follow it
  return (
    <SheetPermissionsContext value={permissions}>
      {permissions.isLimited ? <NPCSheetSimple /> : <NPCSheetFull />}
    </SheetPermissionsContext>
  );
};

NPCSheet.displayName = "NPCSheet";
