import { cx } from "@emotion/css";
import { Fragment, ReactNode, useMemo } from "react";

import { assertGame } from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/InvestigatorCombat";
import { settings } from "../../settings/settings";
import { StandardInitiative } from "./StandardInitiative";
import { TurnPassingInitiative } from "./TurnPassingInitiative";
import { TurnInfo } from "./types";

interface CombatantRowProps {
  turn: TurnInfo;
  combat: InvestigatorCombat;
  index: number;
}

const settingsUseTurnPassingInitiative = settings.useTurnPassingInitiative.get;

export const CombatantRow = ({ turn, combat, index }: CombatantRowProps) => {
  assertGame(game);
  const localize = game.i18n.localize.bind(game.i18n);

  const turnPassing = settingsUseTurnPassingInitiative();
  const active = combat.activeTurnPassingCombatant === turn.id;
  const depleted = turn.passingTurnsRemaining <= 0;

  // turn.effects;

  const effectsTooltip = useMemo(() => {
    if (!turn.effects.length) return "";
    const ul = document.createElement("ul");
    ul.classList.add("effects-tooltip", "plain");
    for (const effect of turn.effects) {
      const img = document.createElement("img");
      img.src = effect.img;
      img.alt = effect.name;
      const span = document.createElement("span");
      span.textContent = effect.name;
      const li = document.createElement("li");
      li.append(img, span);
      ul.append(li);
    }
    return ul.outerHTML;
  }, [turn.effects]);

  return (
    <li
      className={cx("combatant", {
        active: turn.active && !turnPassing,
        hide: turn.hidden,
        defeated: turn.defeated,
      })}
      data-combatant-id={turn.id}
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
        src={turn.img}
        alt={turn.name}
        loading="lazy"
      />
      <div className="token-name">
        <strong className="name">{turn.name}</strong>
        <div className="combatant-controls">
          {game.user.isGM && (
            <Fragment>
              <button
                type="button"
                className={cx(
                  "inline-control combatant-control icon fa-solid",
                  {
                    "fa-eye-slash active": turn.hidden,
                    "fa-eye": !turn.hidden,
                  },
                )}
                data-action="toggleHidden"
                data-tooltip=""
                aria-label={localize("COMBAT.ToggleVis")}
              ></button>
              <button
                type="button"
                className={cx(
                  "inline-control combatant-control icon fa-solid fa-skull",
                  {
                    active: turn.defeated,
                  },
                )}
                data-action="toggleDefeated"
                data-tooltip=""
                aria-label={localize("COMBAT.ToggleDead")}
              ></button>
            </Fragment>
          )}
          <button
            type="button"
            className="inline-control combatant-control icon fa-solid fa-bullseye-arrow"
            data-action="pingCombatant"
            data-tooltip=""
            aria-label={localize("COMBAT.PingCombatant")}
          ></button>
          <div className="token-effects" data-tooltip-html={effectsTooltip}>
            {Array.from(turn.effects).map<ReactNode>((effect, i) => (
              <img key={i} className="token-effect" src={effect.img} />
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
