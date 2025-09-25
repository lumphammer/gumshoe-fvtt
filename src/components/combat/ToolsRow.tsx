import { memo, useCallback } from "react";

import { isTurnPassingCombat } from "../../module/combat/turnPassingCombat";
import { localize } from "./functions";
import { useTrackerContext } from "./TrackerContext";

export const ToolsRow = memo(function ToolsRow() {
  const { combat } = useTrackerContext();
  if (combat === null) {
    throw new Error("No active combat found");
  }

  const handleSortCombatants = useCallback(() => {
    void combat.sortCombatants();
  }, [combat]);

  if (isTurnPassingCombat(combat)) {
    return null;
  }

  return (
    <nav
      className="combat-controls"
      css={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
      }}
    >
      {" "}
      <button
        type="button"
        className=""
        onClick={handleSortCombatants}
        data-tooltip=""
        aria-label={localize("COMBAT.RoundPrev")}
      >
        Sort combatants
      </button>
    </nav>
  );
});
