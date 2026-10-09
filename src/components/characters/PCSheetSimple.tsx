import { useRefreshOnActorItemChanges } from "../../hooks/useRefreshOnActorItemChanges";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertPCActor } from "../../module/actors/pc";
import { settings } from "../../settings/settings";
import { CharacterSheetSimple } from "./CharacterSheetSimple";

/**
 * What people with Limited permission see of a PC: their name, occupation and
 * portrait. (Based on an idea by Muwak77, in #819.)
 */
export const PCSheetSimple = () => {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  // the occupation is an item, which can change without the actor changing
  useRefreshOnActorItemChanges(actor);
  const occupation =
    actor.system.getOccupations()[0]?.name ?? settings.genericOccupation.get();
  return <CharacterSheetSimple subText={occupation} />;
};

PCSheetSimple.displayName = "PCSheetSimple";
