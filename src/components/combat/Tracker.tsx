import { produce } from "immer";
import { useEffect, useState } from "react";

import { assertGame } from "../../functions/isGame";
import { assertNotNull, systemLogger } from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/combat/InvestigatorCombat";
import { CombatantList } from "./CombatantList";
import { EncounterNav } from "./EncounterNav";
import { NoCombatants } from "./NoCombatants";
import { NoCombats } from "./NoCombats";
import { registerHookHandler } from "./registerHookHandler";
import { ToolsRow } from "./ToolsRow";
import { TrackerContextProvider, TrackerContextType } from "./trackerContext";
import { TurnNav } from "./TurnNav";

/**
 * Extracts the relevant combat state from a Combat document.
 */
function getCombatStateFromCombat(
  combat: Combat.Implementation | undefined,
): TrackerContextType {
  assertGame(game);

  return {
    combatState: combat?.toJSON() ?? null,
    combat: combat ?? null,
    turnIds: combat?.turns.map((c) => c._id).filter((id) => id !== null) ?? [],
    isActiveUser: combat?.combatant?.players?.includes(game.user) ?? false,
  };
}

/**
 * The main combat tracker component.
 */
export const Tracker = () => {
  assertGame(game);
  assertNotNull(game.user);

  // STATE & DERIVED DATA

  const combat = game.combat as InvestigatorCombat | undefined;

  const [combatData, setCombatData] = useState<TrackerContextType>(() => {
    return getCombatStateFromCombat(combat);
  });

  useEffect(() => {
    return registerHookHandler(
      "updateCombat",
      (updatedCombat, changes) => {
        systemLogger.log("Combat updated", {
          id: updatedCombat._id,
          active: updatedCombat.active,
        });
        setCombatData((oldData) => {
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
            // this is an update to the current combat
            const result: TrackerContextType = {
              combatState: produce(oldData.combatState, (draft) => {
                foundry.utils.mergeObject(draft, changes);
              }),
              combat: updatedCombat,
              turnIds: updatedCombat.turns
                .map((c) => c._id)
                .filter((id) => id !== null),
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

  useEffect(() => {
    return registerHookHandler("createCombat", (newCombat) => {
      if (newCombat.active) {
        setCombatData(getCombatStateFromCombat(newCombat));
      }
    });
  }, []);

  const combatId = combat?._id;
  const combatCount = game.combats?.combats.length ?? 0;
  const combatIndex = game.combats?.combats.findIndex(
    (x) => x._id === combatId,
  );
  const prevCombatId = game.combats?.combats[combatIndex - 1]?._id;
  const nextCombatId = game.combats?.combats[combatIndex + 1]?._id;

  // foundry's native combat tracker uses these things called "turns" which are
  // kinda pre-baked data for the rows in the tracker - each one corresponds to
  // a combatant in the combat
  // const turns = combat ? getTurns(combat) : [];
  return (
    <TrackerContextProvider value={combatData}>
      {/* HEADER ROWS */}
      <header id="combat-round" className="combat-tracker-header">
        {combat && (
          /* TOP ROW: ➕ 1️⃣ 2️⃣ 3️⃣ ⚙️ */
          <EncounterNav
            combatId={combatId}
            combatIndex={combatIndex}
            combatCount={combatCount}
            prevCombatId={prevCombatId}
            nextCombatId={nextCombatId}
          />
        )}

        {combat && <TurnNav />}
        <ToolsRow />
      </header>
      {!combat && <NoCombats />}
      {combat && combat.turns.length === 0 && <NoCombatants />}
      {combat && <CombatantList />}
    </TrackerContextProvider>
  );
};
