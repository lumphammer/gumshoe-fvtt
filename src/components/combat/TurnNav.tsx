import { keyframes } from "@emotion/react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FaChevronDown, FaCog, FaRecycle, FaShoePrints } from "react-icons/fa";
import { FaArrowDownWideShort } from "react-icons/fa6";
import { LuSwords } from "react-icons/lu";

import { assertGame } from "../../functions/isGame";
import { CombatTrackerConfig } from "../../fvtt-exports";
import { InvestigatorCombat } from "../../module/combat/InvestigatorCombat";
import { isTurnPassingCombatant } from "../../module/combat/turnPassingCombatant";
import { NativeDropdownMenu, NativeMenuItem } from "../inputs/NativeMenu";
import { format, localize } from "./functions";

interface TurnNavProps {
  isTurnPassing: boolean;
  combat: InvestigatorCombat;
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

export const TurnNav = memo(
  ({ isTurnPassing, combat: actualCombat }: TurnNavProps) => {
    assertGame(game);
    const [combatState, setCombatState] = useState(actualCombat.toJSON());
    const [turns, setTurns] = useState(actualCombat.turns);
    const [isActiveUser, setIsActiveUser] = useState(
      actualCombat.combatant?.players?.includes(game.user),
    );

    useEffect(() => {
      const handleUpdateCombat = (updatedCombat: InvestigatorCombat) => {
        if (updatedCombat.id !== actualCombat.id) return;
        setCombatState(updatedCombat.toJSON());
        setTurns(updatedCombat.turns);
        setIsActiveUser(updatedCombat.combatant?.players?.includes(game.user));
      };
      Hooks.on("updateCombat", handleUpdateCombat);
      return () => {
        Hooks.off("updateCombat", handleUpdateCombat);
      };
    }, [actualCombat.id]);

    const allTurnsDone = useMemo(() => {
      return (
        (turns.length ?? 0) > 0 &&
        turns.every(
          (turn) =>
            isTurnPassingCombatant(turn) &&
            turn.system.passingTurnsRemaining <= 0,
        )
      );
    }, [turns]);

    const handleNextRound = useCallback(() => {
      void actualCombat.nextRound();
    }, [actualCombat]);

    const handlePreviousRound = useCallback(() => {
      void actualCombat.previousRound();
    }, [actualCombat]);

    const handleNextTurn = useCallback(() => {
      void actualCombat.nextTurn();
    }, [actualCombat]);

    const handlePreviousTurn = useCallback(() => {
      void actualCombat.previousTurn();
    }, [actualCombat]);

    const handleStartCombat = useCallback(() => {
      void actualCombat.startCombat();
    }, [actualCombat]);

    return (
      <nav className="combat-controls">
        {game.user.isGM ? (
          <>
            {combatState?.round ? (
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
                          round: combatState.round.toString(),
                        })}
                        <FaChevronDown />
                      </>
                    }
                  >
                    {/* SETTINGS */}
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

                    {/* CLEAR MOVEMENT HISTORIES */}
                    <NativeMenuItem
                      icon={<FaShoePrints />}
                      onSelect={() => {
                        void actualCombat.clearMovementHistories();
                      }}
                    >
                      {localize("COMBAT.ClearMovementHistories")}
                    </NativeMenuItem>

                    {/* INITIATIVE RESET */}
                    <NativeMenuItem
                      icon={<FaRecycle />}
                      onSelect={() => {
                        void actualCombat.resetAll();
                      }}
                    >
                      {localize("COMBAT.InitiativeReset")}
                    </NativeMenuItem>

                    {/* SORT */}
                    <NativeMenuItem
                      icon={<FaArrowDownWideShort />}
                      onSelect={() => {
                        void actualCombat.sortCombatants();
                      }}
                    >
                      {localize("investigator.SortCombatants")}
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
                disabled={(turns.length ?? 0) === 0}
                css={{
                  cursor: (turns.length ?? 0) === 0 ? "not-allowed" : "pointer",
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
              {isActiveUser && !isTurnPassing && (
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
                  color: "var(--color-text-primary)",
                }}
              >
                {combatState.round
                  ? format("COMBAT.Round", {
                      round: combatState.round.toString(),
                    })
                  : localize("COMBAT.NotStarted")}
              </strong>

              {isActiveUser && !isTurnPassing && (
                <button
                  type="button"
                  className="inline-control combat-control icon fa-solid fa-arrow-right"
                  onClick={handleNextTurn}
                  data-tooltip=""
                  aria-label={localize("COMBAT.TurnNext")}
                />
              )}
            </>
          )
        )}
      </nav>
    );
  },
);

TurnNav.displayName = "TurnNav";
