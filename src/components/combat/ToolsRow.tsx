import { memo, useCallback } from "react";

import { isClassicCombat } from "../../module/combat/classicCombat";
import { isTurnPassingCombat } from "../../module/combat/turnPassingCombat";
import { localize } from "./functions";
import { useClassicTrackerContext } from "./TrackerContext";

export const ToolsRow = memo(function ToolsRow() {
  const { combat, turnIds } = useClassicTrackerContext();
  if (combat === null) {
    throw new Error("No active combat found");
  }

  const handleSortCombatants = useCallback(() => {
    void combat.system.sortCombatants();
  }, [combat]);

  return (
    <nav
      className="combat-controls"
      css={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      {isTurnPassingCombat(combat) && "Turn-passing"}
      {isClassicCombat(combat) && (
        <>
          <span>Classic</span>

          <button
            type="button"
            disabled={turnIds.length < 2}
            className=""
            onClick={handleSortCombatants}
            data-tooltip=""
            aria-label={localize("COMBAT.RoundPrev")}
          >
            Sort combatants
          </button>
        </>
      )}
    </nav>
  );
});
