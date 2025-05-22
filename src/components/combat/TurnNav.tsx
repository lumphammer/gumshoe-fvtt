import { keyframes } from "@emotion/react";
import { FaChevronDown, FaCog, FaRecycle, FaShoePrints } from "react-icons/fa";

import { assertGame } from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";
import { Dropdown } from "../inputs/Dropdown";
import { Menu, MenuItem } from "../inputs/Menu";
import { format, localize } from "./functions";

interface TurnNavProps {
  isTurnPassing: boolean;
  hasCombat: boolean;
  combat: InvestigatorCombat | null;
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

export const TurnNav = ({
  isTurnPassing,
  hasCombat,
  combat,
  game,
}: TurnNavProps) => {
  assertGame(game);

  const allTurnsDone =
    (combat?.turns.length ?? 0) > 0 &&
    combat?.turns.every((turn) => turn.passingTurnsRemaining <= 0);

  return (
    <nav className="combat-controls">
      {hasCombat &&
        (game.user.isGM ? (
          <>
            {combat?.round ? (
              <>
                <button
                  type="button"
                  className="inline-control combat-control icon fa-solid fa-chevrons-left"
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
                      ":hover": {
                        color: "var(--button-hover-text-color)",
                      },
                    }}
                  >
                    {
                      <Menu>
                        {/* SETTINGS */}
                        <MenuItem
                          icon={<FaCog />}
                          onClick={() => {
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
                      className="inline-control combat-control icon fa-solid fa-chevrons-right"
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
                      ":hover": {
                        color: "var(--button-hover-text-color)",
                      },
                    }}
                  >
                    {localize("COMBAT.RoundNext")}
                    <i className="fa-solid fa-chevrons-right" inert></i>
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                className="combat-control combat-control-lg"
                data-action="startCombat"
                disabled={(combat?.turns.length ?? 0) === 0}
                css={{
                  cursor:
                    (combat?.turns.length ?? 0) === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                <i className="fa-solid fa-swords" inert></i>
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
                    ></button>
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
                  ? format("COMBAT.Round", { round: combat?.round })
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
                  ></button>
                )}
            </>
          )
        ))}
    </nav>
  );
};
