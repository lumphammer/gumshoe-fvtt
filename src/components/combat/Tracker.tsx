import { assertGame } from "../../functions/isGame";
import { assertNotNull } from "../../functions/utilities";
import { isClassicCombat } from "../../module/combat/classicCombat";
import { InvestigatorCombat } from "../../module/combat/InvestigatorCombat";
import { isTurnPassingCombat } from "../../module/combat/turnPassingCombat";
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
 * The main combat tracker component.
 */
export const Tracker = () => {
  assertGame(game);
  assertNotNull(game.user);

  // STATE & DERIVED DATA

  const combat = game.combat as InvestigatorCombat | null;

  const combatData = useTrackerContextValue(combat);

  const combatId = combat?._id;
  const combatCount = game.combats?.combats.length ?? 0;
  const combatIndex = game.combats?.combats.findIndex(
    (x) => x._id === combatId,
  );
  const prevCombatId = game.combats?.combats[combatIndex - 1]?._id;
  const nextCombatId = game.combats?.combats[combatIndex + 1]?._id;

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

        {isTurnPassingCombat(combat) && <TurnPassingTurnNav />}
        {isClassicCombat(combat) && (
          <>
            <ClassicTurnNav />
            <ClassicToolsRow />
          </>
        )}
      </header>
      {!combat && <NoCombats />}
      {combat && combat.turns.length === 0 && <NoCombatants />}
      {combat && <CombatantList />}
    </TrackerContextProvider>
  );
};
