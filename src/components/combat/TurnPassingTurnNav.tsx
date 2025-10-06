import { keyframes } from "@emotion/react";
import { memo, useCallback, useMemo } from "react";
import { FaChevronDown, FaCog, FaRecycle, FaShoePrints } from "react-icons/fa";
import { LuSwords } from "react-icons/lu";

import { assertGame } from "../../functions/isGame";
import { CombatTrackerConfig } from "../../fvtt-exports";
import { isTurnPassingCombatant } from "../../module/combat/turnPassingCombatant";
import { NativeDropdownMenu, NativeMenuItem } from "../inputs/NativeMenu";
import { format, localize } from "./functions";
import { useTurnPassingTrackerContext } from "./TrackerContext";

const throbbingBg = keyframes({
  "0%": {
    backgroundColor: "transparent",
  },
  "100%": {
    backgroundColor:
      "oklch(from var(--button-hover-background-color) l c h / 0.5)",
  },
});

export const TurnPassingTurnNav = memo(function TurnPassingTurnNav() {
  assertGame(game);
  const { combatState, turnIds, combat } = useTurnPassingTrackerContext();

  if (combat === null || combatState === null) {
    throw new Error("TurnPassingTurnNav must be rendered with a combat.");
  }

  const allTurnsDone = useMemo(() => {
    return (
      (turnIds.length ?? 0) > 0 &&
      turnIds.every((turnId) => {
        const turn = combat.turns.find((c) => c.id === turnId);
        if (isTurnPassingCombatant(turn)) {
          return turn.system.passingTurnsRemaining <= 0;
        }
        return false;
      })
    );
  }, [combat.turns, turnIds]);

  const handleNextRound = useCallback(() => {
    void combat.nextRound();
  }, [combat]);

  const handlePreviousRound = useCallback(() => {
    void combat.previousRound();
  }, [combat]);

  const handleStartCombat = useCallback(() => {
    void combat.startCombat();
  }, [combat]);

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
            </>
          ) : (
            <button
              type="button"
              className="combat-control combat-control-lg"
              onClick={handleStartCombat}
              disabled={(turnIds.length ?? 0) === 0}
              css={{
                cursor: (turnIds.length ?? 0) === 0 ? "not-allowed" : "pointer",
              }}
            >
              <LuSwords />
              <span>{localize("COMBAT.Begin")}</span>
            </button>
          )}
        </>
      ) : (
        game.user && (
          <strong
            css={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              color: "var(--color-text-primary)",
            }}
          >
            {combatState?.round
              ? format("COMBAT.Round", {
                  round: combatState?.round.toString(),
                })
              : localize("COMBAT.NotStarted")}
          </strong>
        )
      )}
    </nav>
  );
});
