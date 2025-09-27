import { produce } from "immer";
import { createContext, useContext, useEffect, useState } from "react";

import { assertGame } from "../../functions/isGame";
import { systemLogger } from "../../functions/utilities";
import { SourceData } from "../../fvtt-exports";
import { useRefStash } from "../../hooks/useRefStash";
import { registerHookHandler } from "./registerHookHandler";

export type TrackerContextType = {
  combatState: SourceData<Combat.Schema> | null;
  combat: Combat.Implementation | null;
  turnIds: string[];
  isActiveUser: boolean;
};

const trackerContext = createContext<TrackerContextType>({
  combatState: null,
  combat: null,
  turnIds: [],
  isActiveUser: false,
});

export const useTrackerContext = () => {
  return useContext(trackerContext);
};

/**
 * Extracts the relevant combat state from a Combat document.
 */
function getCombatStateFromCombat(
  combat: Combat.Implementation | null,
): TrackerContextType {
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

export const useTrackerContextValue = (
  combat: Combat.Implementation | null,
) => {
  const [combatData, setCombatData] = useState<TrackerContextType>(() => {
    return getCombatStateFromCombat(combat);
  });

  const combatStash = useRefStash(combat);

  useEffect(() => {
    return registerHookHandler(
      "updateCombat",
      (updatedCombat, changes) => {
        setCombatData((oldData) => {
          assertGame(game);
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
            const result: TrackerContextType = {
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
      if (newCombat.active) {
        setCombatData(getCombatStateFromCombat(newCombat));
      }
    });
  }, []);

  return combatData;
};

export const TrackerContextProvider = trackerContext.Provider;
