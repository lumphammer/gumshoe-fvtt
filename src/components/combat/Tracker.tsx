import { cx } from "@emotion/css";
import { Fragment, MouseEvent, ReactNode, useCallback } from "react";

import {
  assertGame,
  assertNotNull,
  sortByKey,
} from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";
import { settings } from "../../settings/settings";
import { CombatantRow } from "./CombatantRow";
import { getTurns } from "./getTurns";

const settingsUseTurnPassing = settings.useTurnPassingInitiative.get;

export const Tracker = () => {
  assertGame(game);
  assertNotNull(game.user);

  // STATE & DERIVED DATA
  const combat = game.combats?.active as InvestigatorCombat | undefined;
  const combatId = combat?._id;
  const combatCount = game.combats?.combats.length ?? 0;
  const hasCombat = !!combat;
  const isTurnPassing = settingsUseTurnPassing();

  // CALLBACKS
  const showConfig = useCallback((ev: MouseEvent) => {
    ev.preventDefault();
    new CombatTrackerConfig().render(true);
  }, []);

  const localize = game.i18n.localize.bind(game.i18n);
  const format = game.i18n.format.bind(game.i18n);

  if (combat === null) {
    return null;
  }

  // foundry's native combat tracker uses these things called "turns" which are
  // kinda pre-baked data for the rows in the tracker - each one corresponds to
  // a combatant in the combat
  const turns = combat ? getTurns(combat) : [];

  return (
    <Fragment>
      {/* HEADER ROWS */}
      <header id="combat-round" className="combat-tracker-header">
        {game.user.isGM &&
          (hasCombat ? (
            /* TOP ROW: ➕ 1️⃣ 2️⃣ 3️⃣ ⚙️ */
            <nav className="encounters tabbed">
              <button
                className="inline-control icon fa-solid fa-plus"
                data-action="createCombat"
                data-tooltip
                aria-label="Create Encounter"
                title={localize("COMBAT.Create")}
              ></button>
              {game.combats.map((buttonCombat, i) => (
                <button
                  type="button"
                  key={i}
                  className={cx("inline-control", {
                    active: buttonCombat._id === combatId,
                  })}
                  data-action="cycleCombat"
                  data-combat-id={buttonCombat._id}
                  data-index={i}
                  title={localize("COMBAT.Encounter")}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                className={"inline-control icon fa-solid fa-gear"}
                title={localize("COMBAT.Encounter")}
                data-action="trackerSettings"
                onClick={(event) => {
                  showConfig(event);
                }}
              ></button>
            </nav>
          ) : (
            // end top row
            <button
              type="button"
              className="combat-control-lg"
              data-action="createCombat"
            >
              <i className="fa-solid fa-plus" inert></i>
              <span>{localize("COMBAT.Create")}</span>
            </button>
          ))}

        {/* SECOND ROW: Roll all / NPCs, Round 1, dropdown */}
        <div
          className={cx({
            encounters: true,
            "encounter-controls": true,
            combat: hasCombat,
          })}
        >
          {combatCount ? (
            <Fragment>
              {combat?.round ? (
                <strong className="encounter-title">
                  {format("COMBAT.Round", { round: combat.round })}
                </strong>
              ) : (
                <strong className="encounter-title">
                  {localize("COMBAT.NotStarted")}
                </strong>
              )}
              <div className="spacer"></div>
              <button
                type="button"
                className="encounter-context-menu inline-control combat-control icon fa-solid fa-ellipsis-vertical"
              ></button>
            </Fragment>
          ) : (
            <strong className="encounter-title">
              {localize("COMBAT.None")}
            </strong>
          )}
        </div>
      </header>
      {/* ACTUAL COMBATANTS, or "turns" in early-medieval foundry-speak */}
      <ol
        // see investigator-combatant-list in the LESS for why we add this class
        className="combat-tracker plain investigator-combatant-list"
        css={{
          position: "relative",
        }}
      >
        {
          // combatant sorting is done in "Combat" but for rendering stability
          // we need to un-sort the combatants and then tell each row where it
          // used to exist in the order
          sortByKey(turns, "id").map<ReactNode>((turn) => (
            <CombatantRow
              key={turn.id}
              index={turns.findIndex((x) => x.id === turn.id)}
              turn={turn}
              combat={combat!}
            />
          ))
        }
      </ol>
      {/* BOTTOM BITS: |< < End combat > >| */}
      {!isTurnPassing && (
        <nav
          className="combat-controls"
          data-tooltip-direction="UP"
          data-application-part="footer"
        >
          {hasCombat &&
            (game.user.isGM ? (
              <Fragment>
                {combat.round ? (
                  <Fragment>
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
                  </Fragment>
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
              </Fragment>
            ) : (
              game.user &&
              combat.combatant?.players?.includes(game.user) && (
                <Fragment>
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
                </Fragment>
              )
            ))}
        </nav>
      )}
    </Fragment>
  );
};
