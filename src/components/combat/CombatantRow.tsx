import { cx } from "@emotion/css";
import { ReactNode } from "react";

import { assertGame } from "../../functions/isGame";
import { isActiveCharacterActor } from "../../module/actors/exports";
import { isClassicCombatant } from "../../module/combat/classicCombatant";
import { InvestigatorCombatant } from "../../module/combat/InvestigatorCombatant";
import { isTurnPassingCombatant } from "../../module/combat/turnPassingCombatant";
import { NativeContextMenuWrapper } from "../inputs/NativeMenu/NativeContextMenuWrapper";
import { ClassicInitiative } from "./ClassicInitiative";
import { TurnPassingInitiative } from "./TurnPassingInitiative";

const getValue = <T,>(resource: T): T | number => {
  if (
    typeof resource === "object" &&
    resource !== null &&
    "value" in resource &&
    typeof resource.value === "number"
  ) {
    return resource.value;
  } else if (typeof resource === "number") {
    return resource;
  }
  return 0;
};

interface CombatantRowProps {
  combatant: InvestigatorCombatant;
  index: number;
}

function getEffectiveEffects(
  actor: Actor.Implementation | null,
): foundry.documents.ActiveEffect.Implementation[] {
  if (!isActiveCharacterActor(actor)) {
    return [];
  }
  return actor.temporaryEffects.filter(
    (e) => !e.statuses.has(CONFIG.specialStatusEffects.DEFEATED),
  );
}

export const CombatantRow = ({ combatant, index }: CombatantRowProps) => {
  assertGame(game);
  const localize = game.i18n.localize.bind(game.i18n);
  const combat = combatant.combat;
  if (combat === null) {
    throw new Error(
      "CombatantRow must be rendered with a combatant that is in combat.",
    );
  }

  const activeCombatantId =
    combat.turn !== null ? combat.turns[combat.turn].id : null;
  const active = activeCombatantId === combatant.id;
  const depleted =
    isTurnPassingCombatant(combatant) &&
    combatant.system.passingTurnsRemaining <= 0;

  const effects = getEffectiveEffects(combatant.actor);

  // based on foundry's CombatTracker#_formatEffectsTooltip
  const effectsTooltip = (() => {
    if (!effects.length) return "";
    const ul = document.createElement("ul");
    ul.classList.add("effects-tooltip", "plain");
    for (const effect of effects) {
      const img = document.createElement("img");
      img.src = effect.img ?? "";
      img.alt = effect.name;
      const span = document.createElement("span");
      span.textContent = effect.name;
      const li = document.createElement("li");
      li.append(img, span);
      ul.append(li);
    }
    return ul.outerHTML;
  })();

  return (
    <NativeContextMenuWrapper>
      <li
        className={cx("combatant", {
          active: combat.turn === index,
          hide: combatant.hidden,
          defeated: combatant.defeated,
        })}
        data-combatant-id={combatant.id}
        css={{
          height: "4em",
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          transform: `translateY(${index * 4}em)`,
          transition: "transform 1000ms",
          opacity: depleted && !active ? 0.7 : 1,
        }}
      >
        <img
          className="token-image"
          src={combatant.img || CONST.DEFAULT_TOKEN}
          alt={combatant.name}
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
            {combatant.name}
          </strong>
          <div className="combatant-controls">
            {game.user.isGM && (
              <>
                <button
                  type="button"
                  className={cx(
                    "inline-control combatant-control icon fa-solid",
                    {
                      "fa-eye-slash active": combatant.hidden,
                      "fa-eye": !combatant.hidden,
                    },
                  )}
                  data-action="toggleHidden"
                  data-tooltip=""
                  aria-label={localize("COMBAT.ToggleVis")}
                />
                <button
                  type="button"
                  className={cx(
                    "inline-control combatant-control icon fa-solid fa-skull",
                    {
                      active: combatant.defeated,
                    },
                  )}
                  data-action="toggleDefeated"
                  data-tooltip=""
                  aria-label={localize("COMBAT.ToggleDead")}
                />
              </>
            )}
            <button
              type="button"
              className="inline-control combatant-control icon fa-solid fa-bullseye-arrow"
              data-action="pingCombatant"
              data-tooltip=""
              aria-label={localize("COMBAT.PingCombatant")}
            />
            <div className="token-effects" data-tooltip-html={effectsTooltip}>
              {Array.from(effects).map<ReactNode>(
                (effect, i) =>
                  effect.img && (
                    <img key={i} className="token-effect" src={effect.img} />
                  ),
              )}
            </div>
          </div>
        </div>

        {combatant.resource !== null && (
          <div className="token-resource">
            <span className="resource">{getValue(combatant.resource)}</span>
          </div>
        )}

        {isTurnPassingCombatant(combatant) ? (
          <TurnPassingInitiative combatant={combatant} />
        ) : isClassicCombatant(combatant) ? (
          <ClassicInitiative combatant={combatant} />
        ) : null}
      </li>
    </NativeContextMenuWrapper>
  );
};
