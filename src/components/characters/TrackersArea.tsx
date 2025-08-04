import { useActorSheetContext } from "../../hooks/useSheetContexts";
import { assertActiveCharacterActor } from "../../module/actors/exports";
import { isGeneralAbilityItem } from "../../module/items/generalAbility";
import { PoolTracker } from "../abilities/PoolTracker";

export const TrackersArea = () => {
  const { actor } = useActorSheetContext();
  assertActiveCharacterActor(actor);
  const abilities = actor.system.getTrackerAbilities().toSorted((a, b) => {
    const aIsPushPool = isGeneralAbilityItem(a) && a.system.isPushPool;
    const bIsPushPool = isGeneralAbilityItem(b) && b.system.isPushPool;
    if (aIsPushPool && !bIsPushPool) {
      return -1;
    } else if (!aIsPushPool && bIsPushPool) {
      return 1;
    } else {
      return (a.name ?? "").localeCompare(b.name ?? "");
    }
  });

  return (
    <>
      {abilities.map((ability, i) => (
        <PoolTracker key={`${ability.name}-- ${i}`} ability={ability} />
      ))}
    </>
  );
};
