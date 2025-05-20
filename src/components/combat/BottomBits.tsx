import { assertGame } from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";
import { localize } from "./functions";

interface BottomBitsProps {
  isTurnPassing: boolean;
  hasCombat: boolean;
  combat: InvestigatorCombat;
  game: Game;
}

export const BottomBits = ({
  isTurnPassing,
  hasCombat,
  combat,
  game,
}: BottomBitsProps) => {
  assertGame(game);
  return (
    <nav className="combat-controls" data-tooltip-direction="UP">
      {hasCombat &&
        (game.user.isGM ? (
          <>
            {combat.round ? (
              <>
                <button
                  type="button"
                  className="inline-control combat-control icon fa-solid fa-backward-step"
                  data-action="previousRound"
                  data-tooltip=""
                  aria-label={localize("COMBAT.TurnPrev")}
                ></button>
                <button
                  type="button"
                  className="inline-control combat-control icon fa-solid fa-arrow-left"
                  data-action="previousTurn"
                  data-tooltip=""
                  aria-label={localize("COMBAT.TurnPrev")}
                ></button>
                <button
                  type="button"
                  className="combat-control combat-control-lg"
                  data-action="endCombat"
                >
                  <i className="fa-solid fa-xmark" inert></i>
                  <span>{localize("COMBAT.End")}</span>
                </button>
                <button
                  type="button"
                  className="inline-control combat-control icon fa-solid fa-arrow-right"
                  data-action="nextTurn"
                  data-tooltip=""
                  aria-label={localize("COMBAT.TurnNext")}
                ></button>
                <button
                  type="button"
                  className="inline-control combat-control icon fa-solid fa-forward-step"
                  data-action="nextRound"
                  data-tooltip=""
                  aria-label={localize("COMBAT.RoundNext")}
                ></button>
              </>
            ) : (
              <button
                type="button"
                className="combat-control combat-control-lg"
                data-action="startCombat"
              >
                <i className="fa-solid fa-swords" inert></i>
                <span>{localize("COMBAT.Begin")}</span>
              </button>
            )}
          </>
        ) : (
          game.user &&
          combat.combatant?.players?.includes(game.user) && (
            <>
              <button
                type="button"
                className="inline-control combat-control icon fa-solid fa-arrow-left"
                data-action="previousTurn"
                data-tooltip=""
                aria-label={localize("COMBAT.TurnPrev")}
              ></button>
              <button
                type="button"
                className="combat-control combat-control-lg"
                data-action="nextTurn"
              >
                <i className="fa-solid fa-check"></i>
                <span>{localize("COMBAT.TurnEnd")}</span>
              </button>
              <button
                type="button"
                className="inline-control combat-control icon fa-solid fa-arrow-right"
                data-action="nextTurn"
                data-tooltip=""
                aria-label={localize("COMBAT.TurnNext")}
              ></button>
            </>
          )
        ))}
    </nav>
  );
};
