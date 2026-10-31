import { memo, useCallback } from "react";
import { FaChevronDown, FaCog, FaRecycle, FaShoePrints } from "react-icons/fa";
import { FaArrowDownWideShort } from "react-icons/fa6";
import { LuSwords } from "react-icons/lu";

import { assertGame } from "../../functions/isGame";
import { CombatTrackerConfig } from "../../fvtt-exports";
import { isClassicCombat } from "../../module/combat/classicCombat";
import { NativeDropdownMenu, NativeMenuItem } from "../inputs/NativeMenu";
import { format, localize } from "./functions";
import type { TrackerContextValue } from "./TrackerContext";

type ClassicTurnNavProps = {
  combat: TrackerContextValue<"classic">["combat"];
  /** The round, or 0 before the combat starts */
  round: number;
  turnCount: number;
  isActiveUser: boolean;
};

/**
 * The round and turn controls. Takes props, not the tracker's context, so a
 * new turn in the same round doesn't re-render it.
 */
export const ClassicTurnNav = memo(function ClassicTurnNav({
  combat,
  round,
  turnCount,
  isActiveUser,
}: ClassicTurnNavProps) {
  assertGame(game);

  const handleNextRound = useCallback(() => {
    void combat.nextRound();
  }, [combat]);

  const handlePreviousRound = useCallback(() => {
    void combat.previousRound();
  }, [combat]);

  const handleNextTurn = useCallback(() => {
    void combat.nextTurn();
  }, [combat]);

  const handlePreviousTurn = useCallback(() => {
    void combat.previousTurn();
  }, [combat]);

  const handleStartCombat = useCallback(() => {
    void combat.startCombat();
  }, [combat]);

  return (
    <nav className="combat-controls">
      {game.user.isGM ? (
        <>
          {round ? (
            // combat started
            <>
              <button
                type="button"
                className="inline-control combat-control icon fa-solid fa-chevrons-left"
                onClick={handlePreviousRound}
                data-tooltip=""
                aria-label={localize("COMBAT.RoundPrev")}
              />
              <button
                type="button"
                className="inline-control combat-control icon fa-solid fa-arrow-left"
                onClick={handlePreviousTurn}
                data-tooltip=""
                aria-label={localize("COMBAT.TurnPrev")}
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

                  {/* SORT */}
                  {isClassicCombat(combat) && (
                    <NativeMenuItem
                      icon={<FaArrowDownWideShort />}
                      onSelect={() => {
                        void combat.system.sortCombatants();
                      }}
                    >
                      {localize("investigator.SortCombatants")}
                    </NativeMenuItem>
                  )}
                </NativeDropdownMenu>
              </strong>
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
                onClick={handleNextRound}
                data-tooltip=""
                aria-label={localize("COMBAT.RoundNext")}
              />
            </>
          ) : (
            // combat not started
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
        // not the gm
        game.user && (
          <>
            {isActiveUser && (
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
              {round
                ? format("COMBAT.Round", {
                    round: round.toString(),
                  })
                : localize("COMBAT.NotStarted")}
            </strong>

            {isActiveUser && (
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
});
