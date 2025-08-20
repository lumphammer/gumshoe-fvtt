import {
  AnimateLayoutChanges,
  defaultAnimateLayoutChanges,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cx } from "@emotion/css";
import { ReactNode } from "react";
import { TbGripVertical } from "react-icons/tb";

import { assertGame } from "../../functions/isGame";
import { systemLogger } from "../../functions/utilities";
import { isActiveCharacterActor } from "../../module/actors/types";
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

// https://github.com/clauderic/dnd-kit/discussions/684#discussioncomment-2462985
// function customAnimateLayoutChanges(args) {
//   if (args.isSorting || args.wasDragging) {
//     return defaultAnimateLayoutChanges(args);
//   }

//   return true;
// }

const customAnimateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

export const CombatantRow = ({ combatant, index }: CombatantRowProps) => {
  assertGame(game);
  const localize = game.i18n.localize.bind(game.i18n);
  const combat = combatant.combat;
  if (combat === null) {
    throw new Error(
      "CombatantRow must be rendered with a combatant that is in combat.",
    );
  }

  const id = combatant.id;
  if (id === null) {
    throw new Error(
      "CombatantRow must be rendered with a combatant that has an id.",
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
  } = useSortable({
    id,
    transition: { duration: 300, easing: "linear" },
    animateLayoutChanges: customAnimateLayoutChanges,
  });

  systemLogger.log("CombatantRow rendered", {
    attributes,
    transform,
    transition,
  });

  return (
    <NativeContextMenuWrapper>
      <li
        ref={setNodeRef}
        className={cx("combatant", {
          active: combat.turn === index,
          hide: combatant.hidden,
          defeated: combatant.defeated,
        })}
        {...attributes}
        data-combatant-id={combatant.id}
        style={{
          transform: CSS.Translate.toString(transform),
          transition,
          opacity: depleted && !active ? 0.7 : 1,
        }}
        css={{
          alignItems: "start",
          // height: "4em",
          // position: "absolute",
          // top: "0",
          // left: "0",
          // width: "100%",
          // transition: "transform 1000ms",
          // transform: `translateY(${index * 4}em)`,
        }}
      >
        <div
          className="drag-handle"
          ref={setActivatorNodeRef}
          {...listeners}
          css={{
            cursor: "row-resize",
            // backgroundColor: "darkred",
            // alignSelf: "stretch",
            // display: "flex",
            // flexDirection: "column",
            // justifyContent: "center",
            // position: "absolute",
            // top: "0",
            // left: "0",
          }}
        >
          <TbGripVertical
            css={{
              marginTop: "calc(calc(var(--sidebar-item-height) / 2) - 6px)",
            }}
          />
        </div>
        <img
          className="token-image"
          src={combatant.img || CONST.DEFAULT_TOKEN}
          alt={combatant.name}
          loading="lazy"
        />
        <div
          css={{
            overflow: "hidden",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            alignSelf: "stretch",
          }}
        >
          <div
            className="top-row"
            css={{
              display: "flex",

              alignItems: "start",
              justifyContent: "space-between",
            }}
          >
            <strong
              className="name"
              css={{
                // whiteSpace: "nowrap",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {/* {CSS.Translate.toString(transform)} */}
              {combatant.name}
            </strong>
            {isTurnPassingCombatant(combatant) ? (
              <TurnPassingInitiative combatant={combatant} />
            ) : isClassicCombatant(combatant) ? (
              <ClassicInitiative combatant={combatant} />
            ) : (
              "null"
            )}
          </div>
          <div className="combatant-controls">
            {combatant.resource !== null && (
              <div className="token-resource">
                <span className="resource">{getValue(combatant.resource)}</span>
              </div>
            )}
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

        {/* {isTurnPassingCombatant(combatant) ? (
          <TurnPassingInitiative combatant={combatant} />
        ) : isClassicCombatant(combatant) ? (
          <ClassicInitiative combatant={combatant} />
        ) : null} */}
      </li>
    </NativeContextMenuWrapper>
  );
};
