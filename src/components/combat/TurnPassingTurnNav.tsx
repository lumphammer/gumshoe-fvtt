import { memo, useCallback } from "react";
import { FaChevronDown, FaCog, FaRecycle, FaShoePrints } from "react-icons/fa";
import { LuSwords } from "react-icons/lu";

import { assertGame } from "../../functions/isGame";
import { CombatTrackerConfig } from "../../fvtt-exports";
import { css, cx } from "../../styled-system/css";
import { NativeDropdownMenu, NativeMenuItem } from "../inputs/NativeMenu";
import { format, localize } from "./functions";
import type { TrackerContextValue } from "./TrackerContext";

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
                className={css({
                  flex: "1",
                  display: "flex",
                  justifyContent: "center",
                })}
              >
                <NativeDropdownMenu
                  className={css({
                    flex: "1",
                    minHeight: "var(--button-size)",
                  })}
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
                onClick={handleNextRound}
                data-tooltip=""
                aria-label={localize("COMBAT.RoundNext")}
                className={cx(
                  "inline-control combat-control",
                  css(
                    {
                      animationTimingFunction: "ease-in-out",
                      color: "var(--color-text-secondary)",
                      "&:hover": { color: "var(--button-hover-text-color)" },
                    },
                    allTurnsDone
                      ? {
                          color: "var(--color-text-primary)",
                          // invThrob is in panda.config.ts
                          "&:not(:hover)": {
                            animationName: "invThrob",
                            animationDuration: "1000ms",
                            animationIterationCount: "infinite",
                            animationDirection: "alternate",
                          },
                        }
                      : {},
                  ),
                )}
              >
                {localize("COMBAT.RoundNext")}
                <i className="fa-solid fa-chevrons-right" inert />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStartCombat}
              disabled={turnCount === 0}
              className={cx(
                "combat-control combat-control-lg",
                css({
                  cursor: "pointer",
                  "&:disabled": { cursor: "not-allowed" },
                }),
              )}
            >
              <LuSwords />
              <span>{localize("COMBAT.Begin")}</span>
            </button>
          )}
        </>
      ) : (
        game.user && (
          <strong
            className={css({
              flex: "1",
              display: "flex",
              justifyContent: "center",
              color: "var(--color-text-primary)",
            })}
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
