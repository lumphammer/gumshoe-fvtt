import { useSheetPermissions } from "../../hooks/useSheetPermissions";
import { SheetPermissionsContext } from "../../hooks/useIsEditable";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { PCSheetFull } from "./PCSheetFull";
import { PCSheetSimple } from "./PCSheetSimple";

export const PCSheet = () => {
  "use memo";

  const { actor } = useActorSheetContext();
  const permissions = useSheetPermissions(actor);
  // Foundry's render doesn't reach React here (the sheet keeps itself
  // current): this follows the actor's ownership, and provides it, so
  // memoised parts' inputs follow it
  return (
    <SheetPermissionsContext value={permissions}>
      {permissions.isLimited ? <PCSheetSimple /> : <PCSheetFull />}
    </SheetPermissionsContext>
  );
};

PCSheet.displayName = "PCSheet";
