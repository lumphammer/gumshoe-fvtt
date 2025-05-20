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

export const TurnBar = ({
  isTurnPassing,
  hasCombat,
  combat,
  game,
}: TurnBarProps) => {
  assertGame(game);
  return (
    <nav className="combat-controls">
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
