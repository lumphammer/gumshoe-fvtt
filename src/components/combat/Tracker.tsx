import { assertGame } from "../../functions/isGame";
import { assertNotNull } from "../../functions/utilities";
import { isClassicCombat } from "../../module/combat/classicCombat";
import type { InvestigatorCombat } from "../../module/combat/InvestigatorCombat";
import { isTurnPassingCombat } from "../../module/combat/turnPassingCombat";
import { isTurnPassingCombatant } from "../../module/combat/turnPassingCombatant";
import { assertKnownCombat } from "../../module/combat/types";
import { ClassicToolsRow } from "./ClassicToolsRow";
import { ClassicTurnNav } from "./ClassicTurnNav";
import { CombatantList } from "./CombatantList";
import { EncounterNav } from "./EncounterNav";
import { NoCombatants } from "./NoCombatants";
import { NoCombats } from "./NoCombats";
import {
  TrackerContextProvider,
  useTrackerContextValue,
} from "./TrackerContext";
import { TurnPassingTurnNav } from "./TurnPassingTurnNav";

/**
 * Whether every combatant in a turn-passing combat has used up their turns.
 * Worked out on every render of the tracker (Foundry re-renders it when a
 * combatant changes), from the live combatants.
 */
const areAllTurnsDone = (combat: Combat.Implementation, turnIds: string[]) =>
  turnIds.length > 0 &&
  turnIds.every((turnId) => {
    const turn = combat.turns.find((c) => c.id === turnId);
    return (
      isTurnPassingCombatant(turn) &&
      (turn.system as { passingTurnsRemaining: number })
        .passingTurnsRemaining <= 0
    );
  });

/**
 * The main combat tracker component.
 */
export const Tracker = () => {
  assertGame(game);
  assertNotNull(game.user, "game.user");

  // STATE & DERIVED DATA

  const combat = game.combat as InvestigatorCombat | null;

  assertKnownCombat(combat);
  const trackerContextValue = useTrackerContextValue(combat);

  const combatId = combat?._id;
  const combatIndex = game.combats?.combats.findIndex(
    (x) => x._id === combatId,
  );
  const prevCombatId = game.combats?.combats[combatIndex - 1]?._id;
  const nextCombatId = game.combats?.combats[combatIndex + 1]?._id;

  return (
    <TrackerContextProvider value={trackerContextValue}>
      {/* HEADER ROWS */}
      <header id="combat-round" className="combat-tracker-header">
        {trackerContextValue.combat && (
          /* TOP ROW: ➕ 1️⃣ 2️⃣ 3️⃣ ⚙️ */
          <EncounterNav
            combat={trackerContextValue.combat}
            combatIndex={combatIndex}
            prevCombatId={prevCombatId}
            nextCombatId={nextCombatId}
          />
        )}

        {isTurnPassingCombat(trackerContextValue.combat) && (
          <TurnPassingTurnNav
            combat={trackerContextValue.combat}
            round={trackerContextValue.combatState?.round ?? 0}
            turnCount={trackerContextValue.turnIds.length}
            allTurnsDone={areAllTurnsDone(
              trackerContextValue.combat,
              trackerContextValue.turnIds,
            )}
          />
        )}
        {isClassicCombat(trackerContextValue.combat) && (
          <>
            <ClassicTurnNav
              combat={trackerContextValue.combat}
              round={trackerContextValue.combatState?.round ?? 0}
              turnCount={trackerContextValue.turnIds.length}
              isActiveUser={trackerContextValue.isActiveUser}
            />
            {game.user.isGM && (
              <ClassicToolsRow
                combat={trackerContextValue.combat}
                turnCount={trackerContextValue.turnIds.length}
              />
            )}
          </>
        )}
      </header>
      {!trackerContextValue.combat && <NoCombats />}
      {trackerContextValue.combat &&
        trackerContextValue.combat.turns.length === 0 && <NoCombatants />}
      {trackerContextValue.combat && <CombatantList />}
    </TrackerContextProvider>
  );
};
