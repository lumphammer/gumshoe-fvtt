import { cx } from "@emotion/css";

import { assertGame } from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";
import { format, localize } from "./functions";

interface TurnHeaderProps {
  hasCombat: boolean;
  combatCount: number;
  combat: InvestigatorCombat;
  game: Game;
}

export const TurnHeader = ({
  hasCombat,
  combatCount,
  combat,
  game,
}: TurnHeaderProps) => {
  assertGame(game);

  return (
    <div
      className={cx({
        encounters: true,
        "encounter-controls": true,
        combat: hasCombat,
      })}
    >
      {combatCount ? (
        <>
          {/* <div className="spacer"></div> */}
          <div
            css={{
              flex: "1",
              display: "flex",
              justifyContent: "flex-start",
            }}
          ></div>
          <div hidden={!game.user.isGM} className="icon"></div>
          {combat?.round ? (
            <strong className="encounter-title">
              {format("COMBAT.Round", { round: combat.round })}
            </strong>
          ) : (
            <strong className="encounter-title">
              {localize("COMBAT.NotStarted")}
            </strong>
          )}
          {/* <div className="spacer"></div> */}
          <div
            css={{
              flex: "1",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              className="encounter-context-menu inline-control combat-control icon fa-solid fa-ellipsis-vertical"
              hidden={!game.user.isGM}
            ></button>
          </div>
          {/* <div className="control-buttons right flexrow">
          </div> */}
        </>
      ) : (
        <strong className="encounter-title">{localize("COMBAT.None")}</strong>
      )}
    </div>
  );
};
