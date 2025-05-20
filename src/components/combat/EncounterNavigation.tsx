import { cx } from "@emotion/css";
import { MouseEvent, useCallback } from "react";

import { assertGame } from "../../functions/utilities";
import { localize } from "./functions";

interface EncounterNavigationProps {
  combatId: string | undefined | null;
}

export const EncounterNavigation = ({ combatId }: EncounterNavigationProps) => {
  assertGame(game);

  const showConfig = useCallback((ev: MouseEvent) => {
    ev.preventDefault();
    new CombatTrackerConfig().render(true);
  }, []);

  return (
    <nav className="encounters tabbed">
      <button
        className="inline-control icon fa-solid fa-plus"
        data-action="createCombat"
        data-tooltip
        aria-label="Create Encounter"
        title={localize("COMBAT.Create")}
      ></button>
      {game.combats.map((buttonCombat, i) => (
        <button
          type="button"
          key={i}
          className={cx("inline-control", {
            active: buttonCombat._id === combatId,
          })}
          data-action="cycleCombat"
          data-combat-id={buttonCombat._id}
          data-index={i}
          title={localize("COMBAT.Encounter")}
        >
          {i + 1}
        </button>
      ))}
      <button
        type="button"
        className={"inline-control icon fa-solid fa-gear"}
        title={localize("COMBAT.Encounter")}
        data-action="trackerSettings"
        onClick={(event) => {
          showConfig(event);
        }}
      ></button>
    </nav>
  );
};
