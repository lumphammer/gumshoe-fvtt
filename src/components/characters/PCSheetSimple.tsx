import * as c from "../../constants";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useSettings } from "../../hooks/useSettings";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertPCActor } from "../../module/actors/pc";
import { CharacterSheetSimple } from "./CharacterSheetSimple";

/**
 * What people with Limited permission see of a PC: their name, occupation and
 * portrait. (Based on an idea by Muwak77, in #819.)
 */
export const PCSheetSimple = () => {
  "use memo";

  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  // the occupation is an item: the first in the occupation slot
  const occupation = useActorSnapshot(
    actor,
    (snapshot) =>
      (snapshot?.items ?? []).find(
        (item) =>
          item.type === c.personalDetail &&
          (item.system as { slotIndex: number }).slotIndex ===
            c.occupationSlotIndex,
      )?.name,
  );
  const genericOccupation = useSettings((s) => s.genericOccupation);
  return <CharacterSheetSimple subText={occupation ?? genericOccupation} />;
};

PCSheetSimple.displayName = "PCSheetSimple";
