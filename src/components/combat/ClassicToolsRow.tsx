import { memo, useCallback } from "react";

import { localize } from "./functions";
import type { TrackerContextValue } from "./TrackerContext";

/**
 * The GM's tools. Takes props, not the tracker's context, so a new turn
 * doesn't re-render it.
 */
export const ClassicToolsRow = memo(function ToolsRow({
  combat,
  turnCount,
}: {
  combat: TrackerContextValue<"classic">["combat"];
  turnCount: number;
}) {
  "use memo";

  const handleSortCombatants = useCallback(() => {
    void combat.system.sortCombatants();
  }, [combat]);

  return (
    <nav
      className="combat-controls"
      css={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
      }}
    >
      <button
        type="button"
        disabled={turnCount < 2}
        className=""
        onClick={handleSortCombatants}
        data-tooltip=""
      >
        {localize("investigator.SortCombatants")}
      </button>
    </nav>
  );
});
