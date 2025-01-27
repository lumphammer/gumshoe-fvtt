import { cx } from "@emotion/css";
import { Fragment, MouseEvent, ReactNode, useCallback } from "react";

import {
  assertGame,
  assertNotNull,
  sortByKey,
} from "../../functions/utilities";
import { useRefStash } from "../../hooks/useRefStash";
import { settings } from "../../settings/settings";
import { Button } from "../inputs/Button";
import { CombatantRow } from "./CombatantRow";
import { getTurns } from "./getTurns";

const settingsUseTurnPassing = settings.useTurnPassingInitiative.get;

export const Tracker = () => {
  assertGame(game);
  assertNotNull(game.user);

  // STATE & DERIVED DATA

  // configured types still don't work
  const combat = game.combats?.active as Combat | undefined;
  const combatId = combat?._id;

  const combatRef = useRefStash(combat);
  const combatCount = game.combats?.combats.length ?? 0;

  const combatIndex = combatId
    ? game.combats?.combats.findIndex((c) => c._id === combatId)
    : undefined;
  const previousId =
    combatIndex !== undefined && combatIndex > 0
      ? game.combats?.combats[combatIndex - 1]._id
      : null;
  const nextId =
    combatIndex !== undefined && combatIndex < combatCount - 1
      ? game.combats?.combats[combatIndex + 1]._id
      : null;

  const linked = combat?.scene !== null;
  const hasCombat = !!combat;

  const scopeLabel = game.i18n.localize(
    `COMBAT.${linked ? "Linked" : "Unlinked"}`,
  );

  const isTurnPassing = settingsUseTurnPassing();

  // CALLBACKS

  const onCombatCreate = useCallback(async (event: MouseEvent) => {
    assertGame(game);
    event.preventDefault();
    const scene = game.scenes?.current;
    const cls = getDocumentClass("Combat");
    // @ts-expect-error .create
    const combat = await cls.create({ scene: scene?.id });
    // @ts-expect-error idgaf
    await combat?.activate({ render: false });
  }, []);

  const showConfig = useCallback((ev: MouseEvent) => {
    ev.preventDefault();
    new CombatTrackerConfig().render(true);
  }, []);

  const onCombatCycle = useCallback(
    async (event: MouseEvent<HTMLAnchorElement>) => {
      assertGame(game);
      event.preventDefault();
      const btn = event.currentTarget;
      const combatId = btn.dataset["combatId"];
      if (combatId === undefined) return;
      const combat = game.combats?.get(combatId) as Combat; // XXX why is this cast needed?
      if (!combat) return;
      await combat.activate({ render: false });
    },
    [],
  );

  const onDeleteCombat = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      void combatRef.current?.delete();
    },
    [combatRef],
  );

  const onToggleSceneLink = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      void combatRef.current?.toggleSceneLink();
    },
    [combatRef],
  );

  const onPreviousRound = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      void combatRef.current?.previousRound();
    },
    [combatRef],
  );

  const onPreviousTurn = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      void combatRef.current?.previousTurn();
    },
    [combatRef],
  );

  const onEndCombat = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      void combatRef.current?.endCombat();
    },
    [combatRef],
  );

  const onNextTurn = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      void combatRef.current?.nextTurn();
    },
    [combatRef],
  );

  const onNextRound = useCallback(() => {
    void combatRef.current?.nextRound();
  }, [combatRef]);

  const onStartCombat = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      void combatRef.current?.startCombat();
    },
    [combatRef],
  );

  const localize = game.i18n.localize.bind(game.i18n);

  if (combat === null) {
    return null;
  }

  // foundry's native combat tracker uses these things called "turns" which are
  // kinda pre-baked data for the rows in the tracker - each one corresponds to
  // a combatant in the combat
  const turns = combat ? getTurns(combat) : [];

  // if (combat === null || combat === undefined) {
  //   return null;
  // }

  return (
    <Fragment>
      {/* TOP ROW: + < Encounter 2/3 > X */}
      <header id="combat-round" className="combat-tracker-header">
        {game.user.isGM && (
          <nav className="encounters flexrow">
            <a
              className="combat-button combat-create"
              title={localize("COMBAT.Create")}
              onClick={onCombatCreate}
            >
              <i className="fas fa-plus"></i>
            </a>
            {combatCount > 0 && (
              <Fragment>
                <a
                  className="combat-button combat-cycle"
                  title={localize("COMBAT.EncounterPrevious")}
                  {...(previousId
                    ? { "data-combat-id": previousId }
                    : { disabled: true })}
                  onClick={onCombatCycle}
                >
                  <i className="fas fa-caret-left"></i>
                </a>
                <h4 className="encounter">
                  {localize("COMBAT.Encounter")} {(combatIndex ?? 0) + 1} /{" "}
                  {combatCount}
                </h4>
                <a
                  className="combat-button combat-cycle"
                  title={localize("COMBAT.EncounterNext")}
                  {...(nextId
                    ? { "data-combat-id": nextId }
                    : { disabled: true })}
                  onClick={onCombatCycle}
                >
                  <i className="fas fa-caret-right"></i>
                </a>
              </Fragment>
            )}
            {combatCount > 0 && (
              <a
                className="combat-button combat-control"
                title={localize("COMBAT.Delete")}
                onClick={onDeleteCombat}
              >
                <i className="fas fa-trash"></i>
              </a>
            )}
          </nav>
        )}

        {/* SECOND ROW: Round 1, link to scene, cog */}
        {/* This used to be a <nav> in v9 but leaving as div doesn't seem to
        break v9 */}
        <div
          className={cx({
            encounters: true,
            "encounter-controls": true,
            flexrow: true,
            combat: hasCombat,
          })}
        >
          <a className="combat-button combat-control" />
          {combatCount ? (
            <Fragment>
              {combat?.round ? (
                <h3 className="encounter-title noborder">
                  {localize("COMBAT.Round")} {combat.round}
                  {isTurnPassing && game.user.isGM && (
                    <Button
                      title={localize("COMBAT.RoundNext")}
                      onClick={onNextRound}
                      css={{
                        display: "inline",
                        width: "auto",
                        lineHeight: 1,
                        marginLeft: "1em",
                      }}
                    >
                      {localize("COMBAT.RoundNext")}
                      &nbsp;
                      <i className="fas fa-arrow-right"></i>
                    </Button>
                  )}
                </h3>
              ) : (
                <h3 className="encounter-title noborder">
                  {localize("COMBAT.NotStarted")}
                </h3>
              )}
            </Fragment>
          ) : (
            // encounter-title noborder
            <h3 className="encounter-title noborder">
              {localize("COMBAT.None")}
            </h3>
          )}

          {game.user.isGM && (
            <Fragment>
              <a
                className="combat-button combat-control"
                // @ts-expect-error foundry uses non-standard "disabled"
                disabled={!hasCombat}
                title={scopeLabel}
                onClick={onToggleSceneLink}
              >
                <i
                  className={cx({
                    fas: true,
                    "fa-link": linked,
                    "fa-unlink": !linked,
                  })}
                />
              </a>
              <a
                className="combat-button combat-settings"
                title={localize("COMBAT.Settings")}
                // data-control="trackerSettings"
                onClick={showConfig}
              >
                <i className="fas fa-cog"></i>
              </a>
            </Fragment>
          )}
        </div>
      </header>
      {/* ACTUAL COMBATANTS, or "turns" in early-medieval foundry-speak */}
      <ol
        id="combat-tracker"
        // see investigator-combatant-list in the LESS for why we add this class
        className="directory-list investigator-combatant-list"
        css={{
          position: "relative",
        }}
      >
        {
          // combatant sorting is done in "Combat" but for rendering stability
          // we need to un-sort the combatants and then tell each row where it
          // used to exist in the order
          // @ts-expect-error idgaf
          sortByKey(turns, "id").map<ReactNode>((turn, i) => (
            <CombatantRow
              key={turn.id}
              index={turns.findIndex((x) => x.id === turn.id)}
              turn={turn}
              // @ts-expect-error idgaf
              combat={combat}
            />
          ))
        }
      </ol>
      {/* BOTTOM BITS: |< < End combat > >| */}
      {!isTurnPassing && (
        <nav id="combat-controls" className="directory-footer flexrow">
          {hasCombat &&
            !isTurnPassing &&
            (game.user.isGM ? (
              <Fragment>
                {combat.round ? (
                  <Fragment>
                    <a
                      title={localize("COMBAT.RoundPrev")}
                      onClick={onPreviousRound}
                    >
                      <i className="fas fa-step-backward"></i>
                    </a>
                    <a
                      title={localize("COMBAT.TurnPrev")}
                      onClick={onPreviousTurn}
                    >
                      <i className="fas fa-arrow-left"></i>
                    </a>
                    <a
                      className="center"
                      title={localize("COMBAT.End")}
                      onClick={onEndCombat}
                    >
                      {localize("COMBAT.End")}
                    </a>
                    <a title={localize("COMBAT.TurnNext")} onClick={onNextTurn}>
                      <i className="fas fa-arrow-right"></i>
                    </a>
                    <a
                      title={localize("COMBAT.RoundNext")}
                      onClick={onNextRound}
                    >
                      <i className="fas fa-step-forward"></i>
                    </a>
                  </Fragment>
                ) : (
                  <a
                    className="combat-control center"
                    title={localize("COMBAT.Begin")}
                    onClick={onStartCombat}
                  >
                    {localize("COMBAT.Begin")}
                  </a>
                )}
              </Fragment>
            ) : (
              game.user &&
              combat.combatant?.players?.includes(game.user) && (
                <Fragment>
                  <a
                    className="combat-control"
                    title={localize("COMBAT.TurnPrev")}
                    onClick={onPreviousTurn}
                  >
                    <i className="fas fa-arrow-left"></i>
                  </a>
                  <a
                    className="combat-control center"
                    title={localize("COMBAT.TurnEnd")}
                    onClick={onNextTurn}
                  >
                    {localize("COMBAT.TurnEnd")}
                  </a>
                  <a
                    className="combat-control"
                    title={localize("COMBAT.TurnNext")}
                    onClick={onNextTurn}
                  >
                    <i className="fas fa-arrow-right"></i>
                  </a>
                </Fragment>
              )
            ))}
        </nav>
      )}
    </Fragment>
  );
};
