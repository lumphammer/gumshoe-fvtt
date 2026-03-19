import { memo } from "react";

import { isClassicCombatant } from "../../../module/combat/classicCombatant";
import { isTurnPassingCombatant } from "../../../module/combat/turnPassingCombatant";
import { ClassicInitiative } from "./ClassicInitiative";
import { useCombatantContext } from "./CombatantContext";
import { TurnPassingInitiative } from "./TurnPassingInitiative";

export const TopRow = memo(function TopRow() {
  const { combatant, combatantState } = useCombatantContext();

  return (
    <div
      className="top-row"
      css={{
        display: "flex",
        alignItems: "start",
        justifyContent: "space-between",
      }}
    >
      <strong
        className="name"
        css={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {combatantState.name}
      </strong>
      {isTurnPassingCombatant(combatant) ? (
        <TurnPassingInitiative />
      ) : isClassicCombatant(combatant) ? (
        <ClassicInitiative />
      ) : (
        "null"
      )}
    </div>
  );
});
