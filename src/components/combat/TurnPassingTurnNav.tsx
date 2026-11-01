import { keyframes } from "@emotion/react";
import { memo, useCallback } from "react";
import { FaChevronDown, FaCog, FaRecycle, FaShoePrints } from "react-icons/fa";
import { LuSwords } from "react-icons/lu";

import { assertGame } from "../../functions/isGame";
import { CombatTrackerConfig } from "../../fvtt-exports";
import { NativeDropdownMenu, NativeMenuItem } from "../inputs/NativeMenu";
import { format, localize } from "./functions";
import type { TrackerContextValue } from "./TrackerContext";

const throbbingBg = keyframes({
  "0%": {
    backgroundColor: "transparent",
  },
  "100%": {
    backgroundColor:
      "oklch(from var(--button-hover-background-color) l c h / 0.5)",
  },
});

type TurnPassingTurnNavProps = {
  combat: TrackerContextValue<"turnPassing">["combat"];
  /** The round, or 0 before the combat starts */
  round: number;
  turnCount: number;
  /** Whether every combatant has used up their turns this round */
  allTurnsDone: boolean;
};

/**
 * The round controls for a turn-passing combat. Takes props, not the
 * tracker's context, so it only re-renders when what it shows changes.
 */
export const TurnPassingTurnNav = memo(function TurnPassingTurnNav({
  combat,
  round,
  turnCount,
  allTurnsDone,
}: TurnPassingTurnNavProps) {
  "use memo";

  assertGame(game);

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
          {round ? (
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
                        round: round.toString(),
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
              disabled={turnCount === 0}
              css={{
                cursor: turnCount === 0 ? "not-allowed" : "pointer",
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
            {round
              ? format("COMBAT.Round", {
                  round: round.toString(),
                })
              : localize("COMBAT.NotStarted")}
          </strong>
        )
      )}
    </nav>
  );
});
