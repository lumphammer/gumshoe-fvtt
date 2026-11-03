import { memo } from "react";

import { liveItem } from "../../functions/liveItems";
import { isAbilityItem } from "../../module/items/exports";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { getTrackerAbilitiesIn } from "../../module/actors/abilitiesDerived";
import { assertActiveCharacterActor } from "../../module/actors/types";
import { PoolTracker } from "../abilities/PoolTracker";

/**
 * Pool trackers for the abilities that want them. Reads the actor through a
 * snapshot, selecting only which abilities: each tracker reads its own.
 */
export const TrackersArea = memo(function TrackersArea() {
  const { actor } = useActorSheetContext();
  assertActiveCharacterActor(actor);
  const ids = useActorSnapshot(actor, (snapshot) =>
    getTrackerAbilitiesIn(snapshot.items).map((item) => item._id ?? ""),
  );

  return (
    <>
      {ids.map((id) => {
        const ability = liveItem(actor, id, isAbilityItem);
        return ability ? <PoolTracker key={id} ability={ability} /> : null;
      })}
    </>
  );
});
