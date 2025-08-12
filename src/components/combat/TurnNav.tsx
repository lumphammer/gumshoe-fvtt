import { keyframes } from "@emotion/react";
import { useCallback } from "react";
import { FaChevronDown, FaCog, FaRecycle, FaShoePrints } from "react-icons/fa";
import { LuSwords } from "react-icons/lu";

import { assertGame } from "../../functions/isGame";
import { CombatTrackerConfig } from "../../fvtt-exports";
import { InvestigatorCombat } from "../../module/combat/InvestigatorCombat";
import { isTurnPassingCombatant } from "../../module/combat/turnPassingCombatant";
import { NativeDropdownMenu, NativeMenuItem } from "../inputs/NativeMenu";
import { format, localize } from "./functions";

interface TurnNavProps {
  isTurnPassing: boolean;
  combat: InvestigatorCombat | undefined;
  game: foundry.Game;
}

const throbbingBg = keyframes({
  "0%": {
    backgroundColor: "transparent",
  },
  "100%": {
    backgroundColor:
      "oklch(from var(--button-hover-background-color) l c h / 0.5)",
  },
});

export const TurnNav = ({ isTurnPassing, combat, game }: TurnNavProps) => {
  assertGame(game);

  const allTurnsDone =
    (combat?.turns.length ?? 0) > 0 &&
    combat?.turns.every(
      (turn) =>
        isTurnPassingCombatant(turn) && turn.system.passingTurnsRemaining <= 0,
    );

  const handleNextRound = useCallback(() => {
    void combat?.nextRound();
  }, [combat]);

  const handlePreviousRound = useCallback(() => {
    void combat?.previousRound();
  }, [combat]);

  const handleNextTurn = useCallback(() => {
    void combat?.nextTurn();
  }, [combat]);

  const handlePreviousTurn = useCallback(() => {
    void combat?.previousTurn();
  }, [combat]);

  const handleStartCombat = useCallback(() => {
    void combat?.startCombat();
  }, [combat]);

  return (
    <nav className="combat-controls">
      {combat &&
        (game.user.isGM ? (
          <>
            {combat?.round ? (
              <>
                <button
                  type="button"
                  className="inline-control combat-control icon fa-solid fa-chevrons-left"
                  onClick={handlePreviousRound}
                  data-tooltip=""
                  aria-label={localize("COMBAT.RoundPrev")}
                />
                {!isTurnPassing && (
                  <button
                    type="button"
                    className="inline-control combat-control icon fa-solid fa-arrow-left"
                    onClick={handlePreviousTurn}
                    data-tooltip=""
                    aria-label={localize("COMBAT.TurnPrev")}
                  />
                )}
                <strong
                  css={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <NativeDropdownMenu
                    css={{ flex: 1, minHeight: "var(--button-size)" }}
                    label={
                      <>
                        {format("COMBAT.Round", {
                          round: combat.round.toString(),
                        })}
                        <FaChevronDown />
                      </>
                    }
                  >
                    <NativeMenuItem
                      icon={<FaCog />}
                      onSelect={() => {
                        return new CombatTrackerConfig().render({
                          force: true,
                        });
                      }}
                    >
                      {localize("COMBAT.Settings")}
                    </NativeMenuItem>

                    <NativeMenuItem
                      icon={<FaShoePrints />}
                      onSelect={() => {
                        void combat.clearMovementHistories();
                      }}
                    >
                      {localize("COMBAT.ClearMovementHistories")}
                    </NativeMenuItem>

                    {/* INITIATIVE RESET */}
                    <NativeMenuItem
                      icon={<FaRecycle />}
                      onSelect={() => {
                        void combat.resetAll();
                      }}
                    >
                      {localize("COMBAT.InitiativeReset")}
                    </NativeMenuItem>
                  </NativeDropdownMenu>
                </strong>
                {!isTurnPassing && (
                  <>
                    <button
                      type="button"
                      className="inline-control combat-control icon fa-solid fa-arrow-right"
                      onClick={handleNextTurn}
                      data-tooltip=""
                      aria-label={localize("COMBAT.TurnNext")}
                    />
                    <button
                      type="button"
                      className="inline-control combat-control icon fa-solid fa-chevrons-right"
                      data-action="nextRound"
                      data-tooltip=""
                      aria-label={localize("COMBAT.RoundNext")}
                    />
                  </>
                )}
                {isTurnPassing && (
                  <button
                    type="button"
                    className="inline-control combat-control"
                    onClick={handleNextRound}
                    data-tooltip=""
                    aria-label={localize("COMBAT.RoundNext")}
                    css={{
                      ":not(:hover)": {
                        animation: allTurnsDone
                          ? `${throbbingBg} 1000ms infinite`
                          : "none",
                        animationDirection: "alternate",
                      },
                      animationTimingFunction: "ease-in-out",
                      color: allTurnsDone
                        ? "var(--color-text-primary)"
                        : "var(--color-text-secondary)",
                      ":hover": {
                        color: "var(--button-hover-text-color)",
                      },
                    }}
                  >
                    {localize("COMBAT.RoundNext")}
                    <i className="fa-solid fa-chevrons-right" inert />
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                className="combat-control combat-control-lg"
                onClick={handleStartCombat}
                disabled={(combat?.turns.length ?? 0) === 0}
                css={{
                  cursor:
                    (combat?.turns.length ?? 0) === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                <LuSwords />
                <span>{localize("COMBAT.Begin")}</span>
              </button>
            )}
          </>
        ) : (
          game.user && (
            <>
              {combat?.combatant?.players?.includes(game.user) &&
                !isTurnPassing && (
                  <>
                    <button
                      type="button"
                      className="inline-control combat-control icon fa-solid fa-arrow-left"
                      data-action="previousTurn"
                      data-tooltip=""
                      aria-label={localize("COMBAT.TurnPrev")}
                    />
                  </>
                )}
              <strong
                css={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  color: "var(--color-text-primary)",
                }}
              >
                {combat?.round
                  ? format("COMBAT.Round", { round: combat?.round.toString() })
                  : localize("COMBAT.NotStarted")}
              </strong>

              {combat?.combatant?.players?.includes(game.user) &&
                !isTurnPassing && (
                  <button
                    type="button"
                    className="inline-control combat-control icon fa-solid fa-arrow-right"
                    data-action="nextTurn"
                    data-tooltip=""
                    aria-label={localize("COMBAT.TurnNext")}
                  />
                )}
            </>
          )
        ))}
    </nav>
  );
};
