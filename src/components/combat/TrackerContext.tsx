import { produce } from "immer";
import { createContext, useContext, useEffect, useState } from "react";

import { assertGame } from "../../functions/isGame";
import { systemLogger } from "../../functions/utilities";
import { useRefStash } from "../../hooks/useRefStash";
import { isClassicCombat } from "../../module/combat/classicCombat";
import { isTurnPassingCombat } from "../../module/combat/turnPassingCombat";
import { isKnownCombat } from "../../module/combat/types";
import { registerHookHandler } from "./registerHookHandler";

export type TrackerContextValue<
  SubType extends
    Combat.ConfiguredSubType | null = Combat.ConfiguredSubType | null,
> = {
  combat: SubType extends Combat.ConfiguredSubType
    ? Combat.OfType<SubType>
    : null;
  combatState: SubType extends Combat.ConfiguredSubType
    ? Combat.SourceOfType<SubType>
    : null;
  turnIds: string[];
  isActiveUser: boolean;
};

const TrackerContext = createContext<TrackerContextValue>({
  combatState: null,
  combat: null,
  turnIds: [],
  isActiveUser: false,
});

export const useTrackerContext = () => {
  return useContext(TrackerContext);
};

export const useClassicTrackerContext = (): TrackerContextValue<"classic"> => {
  const context = useContext(TrackerContext);
  if (isClassicCombat(context.combat)) {
    return context as TrackerContextValue<"classic">;
  } else {
    throw new Error("useClassicTrackerContext used with non-classic combat");
  }
};

export const useTurnPassingTrackerContext =
  (): TrackerContextValue<"turnPassing"> => {
    const context = useContext(TrackerContext);
    if (isTurnPassingCombat(context.combat)) {
      return context as TrackerContextValue<"turnPassing">;
    } else {
      throw new Error(
        "useTurnPassingTrackerContext used with non-turn-passing combat",
      );
    }
  };

/**
 * Extracts the relevant combat state from a Combat document.
 */
function getCombatStateFromCombat(
  combat: Combat.Known | null,
): TrackerContextValue {
  assertGame(game);

  return {
    combatState: combat?.toJSON() ?? null,
    combat: combat ?? null,
    turnIds: combat?.turns.map((c) => c._id).filter((id) => id !== null) ?? [],
    isActiveUser: combat?.combatant?.players?.includes(game.user) ?? false,
  };
}

function getUpdatedTurnIds(oldIds: string[], combat: Combat.Implementation) {
  const newIds = combat.turns.map((c) => c._id).filter((id) => id !== null);
  if (
    newIds.length === oldIds.length &&
    newIds.every((id, i) => id === oldIds[i])
  ) {
    return oldIds;
  } else {
    return newIds;
  }
}

export const useTrackerContextValue = (combat: Combat.Known | null) => {
  const [combatData, setCombatData] = useState<TrackerContextValue>(() => {
    return getCombatStateFromCombat(combat);
  });

  const combatStash = useRefStash(combat);

  useEffect(() => {
    return registerHookHandler(
      "updateCombat",
      (updatedCombat, changes) => {
        setCombatData((oldData) => {
          assertGame(game);
          if (!isKnownCombat(updatedCombat)) {
            return oldData;
          }
          if (
            oldData.combatState?._id !== updatedCombat._id &&
            updatedCombat.active
          ) {
            // if a combat is becoming active, we just take its data
            systemLogger.log("New combat activated");
            return getCombatStateFromCombat(updatedCombat);
          } else if (
            oldData.combatState &&
            oldData.combatState._id === updatedCombat._id
          ) {
            // const newTurnIds = updatedCombat.turns
            //   .map((c) => c._id)
            //   .filter((id) => id !== null);
            // const turnIds =
            //   newTurnIds.length === oldData.turnIds.length &&
            //   newTurnIds.every((id, i) => id === oldData.turnIds[i])
            //     ? oldData.turnIds
            //     : newTurnIds;
            const combatState = produce(oldData.combatState, (draft) => {
              foundry.utils.mergeObject(draft, changes);
            });
            const turnIds = getUpdatedTurnIds(oldData.turnIds, updatedCombat);
            const result: TrackerContextValue = {
              combatState,
              combat: updatedCombat,
              turnIds,
              isActiveUser:
                updatedCombat.combatant?.players?.includes(game.user) ?? false,
            };
            return result;
          } else {
            return oldData;
          }
        });
      },
      true,
    );
  }, []);

  function updateTurns(combat: Combat.Implementation | null) {
    setCombatData((oldData) => {
      if (combat === null || combat?.id !== oldData.combat?.id) return oldData;
      return {
        ...oldData,
        turnIds: getUpdatedTurnIds(oldData.turnIds, combat),
      };
    });
  }

  useEffect(() => {
    return registerHookHandler("createCombatant", (newCombatant) => {
      updateTurns(newCombatant.combat);
    });
  }, []);

  useEffect(() => {
    return registerHookHandler("deleteCombatant", (deletedCombatant) => {
      updateTurns(deletedCombatant.combat);
    });
  }, [combatStash]);

  useEffect(() => {
    return registerHookHandler("createCombat", (newCombat) => {
      if (newCombat.active && isKnownCombat(newCombat)) {
        setCombatData(getCombatStateFromCombat(newCombat));
      }
    });
  }, []);

  return combatData;
};

export const TrackerContextProvider = TrackerContext.Provider;
