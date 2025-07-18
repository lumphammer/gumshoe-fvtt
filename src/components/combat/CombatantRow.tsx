import { cx } from "@emotion/css";
import { ReactNode, useMemo } from "react";

import { assertGame } from "../../functions/isGame";
import { InvestigatorCombat } from "../../module/combat/InvestigatorCombat";
import { isTurnPassingCombat } from "../../module/combat/turnPassingCombat";
import { NativeContextMenuWrapper } from "../inputs/NativeMenu/NativeContextMenuWrapper";
import { ClassicInitiative } from "./ClassicInitiative";
import { TurnPassingInitiative } from "./TurnPassingInitiative";
import { TurnInfo } from "./types";

interface CombatantRowProps {
  turn: TurnInfo;
  combat: InvestigatorCombat;
  index: number;
}

export const CombatantRow = ({ turn, combat, index }: CombatantRowProps) => {
  assertGame(game);
  const localize = game.i18n.localize.bind(game.i18n);

  const activeCombatantId =
    combat.turn !== null ? combat.turns[combat.turn].id : null;
  const active = activeCombatantId === turn.id;
  const turnPassing = isTurnPassingCombat(combat);
  const depleted = turnPassing && turn.passingTurnsRemaining <= 0;

  // based on foundry's CombatTracker#_formatEffectsTooltip
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
    <NativeContextMenuWrapper>
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
          ".theme-light &": {
            boxShadow: active
              ? "0 0 0.5em 0 oklch(0.2 0.3 130 / 0.7) inset"
              : undefined,
            backgroundColor: active ? "oklch(0.9 0.1 130 / 0.5)" : undefined,
          },
          ".theme-dark &": {
            boxShadow: active
              ? "0 0 0.5em 0 oklch(0.9 0.3 130 / 0.7) inset"
              : undefined,
            backgroundColor: active ? "oklch(0.3 0.1 130 / 0.5)" : undefined,
          },
          opacity: depleted && !active ? 0.7 : 1,
        }}
      >
        <img
          className="token-image"
          src={turn.img}
          alt={turn.name}
          loading="lazy"
        />
        <div
          className="token-name"
          css={{
            overflow: "hidden",
          }}
        >
          <strong
            className="name"
            css={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {turn.name}
          </strong>
          <div className="combatant-controls">
            {game.user.isGM && (
              <>
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
              </>
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
          <ClassicInitiative turn={turn} combat={combat} />
        )}
      </li>
    </NativeContextMenuWrapper>
  );
};
