import { keyframes } from "@emotion/react";
import { FaChevronDown, FaCog, FaRecycle, FaShoePrints } from "react-icons/fa";

import { assertGame } from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";
import { Dropdown } from "../inputs/Dropdown";
import { Menu, MenuItem } from "../inputs/Menu";
import { format, localize } from "./functions";

interface TurnBarProps {
  isTurnPassing: boolean;
  hasCombat: boolean;
  combat: InvestigatorCombat;
  game: Game;
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

export const TurnBar = ({
  isTurnPassing,
  hasCombat,
  combat,
  game,
}: TurnBarProps) => {
  assertGame(game);

  const allTurnsDone = combat.turns.every(
    (turn) => turn.passingTurnsRemaining <= 0,
  );
  const turnsDone = combat.turns.reduce(
    (acc, turn) => {
      if (turn.passingTurnsRemaining <= 0) {
        acc.done++;
      } else {
        acc.remaining++;
      }
      return acc;
    },
    { done: 0, remaining: 0 },
  );

  console.log(
    `${turnsDone.done}/${turnsDone.done + turnsDone.remaining}: ${allTurnsDone ? "DONE" : "-"}`,
  );

  return (
    <nav className="combat-controls">
      {hasCombat &&
        (game.user.isGM ? (
          <>
            {combat.round ? (
              <>
                <button
                  type="button"
                  className="inline-control combat-control icon fa-solid fa-arrow-left"
                  data-action="previousRound"
                  data-tooltip=""
                  aria-label={localize("COMBAT.RoundPrev")}
                ></button>
                {!isTurnPassing && (
                  <button
                    type="button"
                    className="inline-control combat-control icon fa-solid fa-arrow-left"
                    data-action="previousTurn"
                    data-tooltip=""
                    aria-label={localize("COMBAT.TurnPrev")}
                  ></button>
                )}
                <strong
                  // className="encounter-title"
                  css={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Dropdown
                    showArrow={false}
                    label={
                      <>
                        {format("COMBAT.Round", { round: combat.round })}
                        <FaChevronDown />
                      </>
                    }
                    className="inline-control"
                    css={{
                      flex: 1,
                      minHeight: "var(--button-size)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {
                      <Menu>
                        {/* SETTINGS */}
                        <MenuItem
                          icon={<FaCog />}
                          onClick={() => {
                            // @ts-expect-error this is fine
                            return new foundry.applications.apps.CombatTrackerConfig().render(
                              { force: true },
                            );
                          }}
                        >
                          {localize("COMBAT.Settings")}
                        </MenuItem>

                        {/* CLEAR MOVEMENT HISTORIES */}
                        <MenuItem
                          icon={<FaShoePrints />}
                          onClick={() => {
                            // @ts-expect-error this is fine
                            combat.clearMovementHistories();
                          }}
                        >
                          {localize("COMBAT.ClearMovementHistories")}
                        </MenuItem>

                        {/* INITIATIVE RESET */}
                        <MenuItem
                          icon={<FaRecycle />}
                          onClick={() => {
                            void combat.resetAll();
                          }}
                        >
                          {localize("COMBAT.InitiativeReset")}
                        </MenuItem>
                      </Menu>
                    }
                  </Dropdown>
                </strong>
                {!isTurnPassing && (
                  <>
                    <button
                      type="button"
                      className="inline-control combat-control icon fa-solid fa-arrow-right"
                      data-action="nextTurn"
                      data-tooltip=""
                      aria-label={localize("COMBAT.TurnNext")}
                    ></button>
                    <button
                      type="button"
                      className="inline-control combat-control icon fa-solid fa-arrow-right"
                      data-action="nextRound"
                      data-tooltip=""
                      aria-label={localize("COMBAT.RoundNext")}
                    ></button>
                  </>
                )}
                {isTurnPassing && (
                  <button
                    type="button"
                    className="inline-control combat-control"
                    data-action="nextRound"
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
                    }}
                  >
                    {localize("COMBAT.RoundNext")}
                    <i className="fa-solid fa-arrow-right" inert></i>
                  </button>
                )}
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
          game.user && (
            <>
              {combat.combatant?.players?.includes(game.user) && (
                <button
                  type="button"
                  className="inline-control combat-control icon fa-solid fa-arrow-left"
                  data-action="previousTurn"
                  data-tooltip=""
                  aria-label={localize("COMBAT.TurnPrev")}
                ></button>
              )}
              <strong
                css={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {format("COMBAT.Round", { round: combat.round })}
              </strong>

              {combat.combatant?.players?.includes(game.user) && (
                <button
                  type="button"
                  className="inline-control combat-control icon fa-solid fa-arrow-right"
                  data-action="nextTurn"
                  data-tooltip=""
                  aria-label={localize("COMBAT.TurnNext")}
                ></button>
              )}
            </>
          )
        ))}
    </nav>
  );
};
