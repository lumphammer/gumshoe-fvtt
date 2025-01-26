import { cx } from "@emotion/css";
import { Fragment, ReactNode } from "react";

import { assertGame } from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";
import { settings } from "../../settings/settings";
import { StandardInitiative } from "./StandardInitiative";
import { TurnPassingInitiative } from "./TurnPassingInitiative";
import { useCombatant } from "./useCombatant";

interface CombatantRowProps {
  turn: any;
  combat: InvestigatorCombat;
  index: number;
}

const settingsUseTurnPassingInitiative = settings.useTurnPassingInitiative.get;

export const CombatantRow = ({ turn, combat, index }: CombatantRowProps) => {
  assertGame(game);
  const {
    onToggleDefeatedStatus,
    onToggleHidden,
    onCombatantHoverIn,
    onCombatantHoverOut,
    localize,
    onDoubleClick,
  } = useCombatant(combat, turn.id);

  const turnPassing = settingsUseTurnPassingInitiative();
  const active = combat.activeTurnPassingCombatant === turn.id;
  const depleted = turn.passingTurnsRemaining <= 0;

  return (
    <li
      className={cx({
        combatant: true,
        actor: true,
        "directory-item": true,
        flexrow: true,
        active: turn.active && !turnPassing,
        hidden: turn.hidden,
        defeated: turn.defeated,
      })}
      data-combatant-id={turn.id}
      onMouseEnter={onCombatantHoverIn}
      onMouseLeave={onCombatantHoverOut}
      onDoubleClick={onDoubleClick}
      css={{
        height: "4em",
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        transform: `translateY(${index * 4}em)`,
        transition: "transform 1000ms",
        boxShadow: active ? "0 0 0.5em 0 #7f7 inset" : undefined,
        backgroundColor: active ? "#9f72" : undefined,
        opacity: depleted && !active ? 0.5 : 1,
      }}
    >
      <img
        className="token-image"
        // the foundry original does some crazy stuff with
        // IntersectionObserver to load images on demand
        src={turn.img}
        title={turn.name}
      />
      <div className="token-name flexcol">
        <h4>{turn.name}</h4>
        <div className="combatant-controls flexrow">
          {game.user.isGM && (
            <Fragment>
              <a
                className={cx({
                  "combatant-control": true,
                  active: turn.hidden,
                })}
                title={localize("COMBAT.ToggleVis")}
                onClick={onToggleHidden}
              >
                <i className="fas fa-eye-slash"></i>
              </a>
              <a
                className={cx({
                  "combatant-control": true,
                  active: turn.defeated,
                })}
                title={localize("COMBAT.ToggleDead")}
                onClick={onToggleDefeatedStatus}
              >
                <i className="fas fa-skull"></i>
              </a>
            </Fragment>
          )}
          <div className="token-effects">
            {Array.from(turn.effects).map<ReactNode>((effect, i) => (
              <img key={i} className="token-effect" src={effect as string} />
            ))}
          </div>
        </div>
      </div>

      {turn.hasResource && (
        <div className="token-resource">
          <span className="resource">{turn.resource}</span>
        </div>
      )}

      {turnPassing ? (
        <TurnPassingInitiative turn={turn} combat={combat} />
      ) : (
        <StandardInitiative turn={turn} combat={combat} />
      )}
    </li>
  );
};
