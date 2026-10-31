import { memo } from "react";

import * as c from "../../constants";
import { useActorSnapshot } from "../../hooks/useActorSnapshot";
import { useActorSheetContext } from "../../hooks/useSheetContexts";
import type { ItemView } from "../../module/actors/pcDerived";
import { assertActiveCharacterActor } from "../../module/actors/types";
import type { AbilityItem } from "../../module/items/exports";
import { PoolTracker } from "../abilities/PoolTracker";

const isAbility = (item: ItemView) =>
  item.type === c.generalAbility || item.type === c.investigativeAbility;

const isPushPool = (item: ItemView) =>
  item.type === c.generalAbility &&
  Boolean((item.system as { isPushPool?: boolean }).isPushPool);

/** The ids of the abilities with trackers: the push pool, then by name */
const getTrackerIdsIn = (items: readonly ItemView[]) =>
  items
    .filter(
      (item) =>
        isAbility(item) &&
        Boolean((item.system as { showTracker?: boolean }).showTracker),
    )
    .toSorted((a, b) => {
      const aIsPushPool = isPushPool(a);
      const bIsPushPool = isPushPool(b);
      if (aIsPushPool && !bIsPushPool) {
        return -1;
      } else if (!aIsPushPool && bIsPushPool) {
        return 1;
      } else {
        return a.name.localeCompare(b.name);
      }
    })
    .map((item) => item._id ?? "");

/**
 * Pool trackers for the abilities that want them. Reads the actor through a
 * snapshot, selecting only which abilities: each tracker reads its own.
 */
export const TrackersArea = memo(function TrackersArea() {
  const { actor } = useActorSheetContext();
  assertActiveCharacterActor(actor);
  const ids = useActorSnapshot(actor, (snapshot) =>
    getTrackerIdsIn(snapshot?.items ?? []),
  );

  return (
    <>
      {ids.map((id) => {
        const ability = actor.items.get(id) as AbilityItem | undefined;
        return ability ? <PoolTracker key={id} ability={ability} /> : null;
      })}
    </>
  );
});
