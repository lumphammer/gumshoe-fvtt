import { produce } from "immer";
import { useEffect, useState } from "react";

import { assertGame } from "../../functions/isGame";
import { assertNotNull } from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/combat/InvestigatorCombat";
import { isTurnPassingCombat } from "../../module/combat/turnPassingCombat";
import { DraggableRowContainer } from "./DraggableRowContainer";
import { EncounterNav } from "./EncounterNav";
import { NoCombatants } from "./NoCombatants";
import { NoCombats } from "./NoCombats";
import { registerHookHandler } from "./registerHookHandler";
import { ToolsRow } from "./ToolsRow";
import { TrackerContextProvider, TrackerContextType } from "./trackerContext";
import { TurnNav } from "./TurnNav";

function getCombatStateFromCombat(
  combat: Combat | undefined,
): TrackerContextType {
  assertGame(game);

  return {
    combat: combat?.toJSON() ?? null,
    turns: combat?.turns.map((c) => c.toJSON()) ?? [],
    isActiveUser: combat?.combatant?.players?.includes(game.user) ?? false,
  };
}

export const Tracker = () => {
  assertGame(game);
  assertNotNull(game.user);

  // STATE & DERIVED DATA

  const combat = game.combat as InvestigatorCombat | undefined;

  const [_combatData, setCombatData] = useState<TrackerContextType>(() => {
    return getCombatStateFromCombat(combat);
  });

  // const [turns, setTurns] = useState(combat?.turns);
  // const [isActiveUser, setIsActiveUser] = useState(
  //   combat?.combatant?.players?.includes(game.user),
  // );

  useEffect(() => {
    return registerHookHandler("updateCombat", (updatedCombat, changes) => {
      // setTurns(updatedCombat.turns);
      // setIsActiveUser(updatedCombat.combatant?.players?.includes(game.user));

      setCombatData((oldData) => {
        if (oldData.combat?._id !== updatedCombat._id && updatedCombat.active) {
          // if a combat is becoming active, we just take its data
          return getCombatStateFromCombat(updatedCombat);
        } else if (oldData.combat !== null) {
          const result: TrackerContextType = {
            combat: produce(oldData.combat, (draft) => {
              foundry.utils.mergeObject(draft, changes);
            }),
            // XXX this is going to be too hot because it's regenerated every time
            // anything in the combat changes, even if it's not the turns
            turns: updatedCombat.turns.map((c) => c.toJSON()),
            isActiveUser:
              updatedCombat.combatant?.players?.includes(game.user) ?? false,
          };
          return result;
        } else {
          return {
            combat: null,
            turns: [],
            isActiveUser: false,
          };
        }
      });
    });
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
  const isTurnPassing = isTurnPassingCombat(combat);

  // foundry's native combat tracker uses these things called "turns" which are
  // kinda pre-baked data for the rows in the tracker - each one corresponds to
  // a combatant in the combat
  // const turns = combat ? getTurns(combat) : [];
  return (
    <TrackerContextProvider value={_combatData}>
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

        {combat && <TurnNav isTurnPassing={isTurnPassing} combat={combat} />}
      </header>
      <ToolsRow />
      {/* ACTUAL COMBATANTS, or "turns" in early-medieval foundry-speak */}
      {!combat && <NoCombats />}
      {combat && combat.turns.length === 0 && <NoCombatants />}
      {/* we need to wrap the actual tracker ol in another element so that
      foundry's autosizing works */}
      {combat && <DraggableRowContainer />}
    </TrackerContextProvider>
  );
};
