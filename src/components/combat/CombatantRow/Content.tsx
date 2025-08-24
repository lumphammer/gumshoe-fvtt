import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { cx } from "@emotion/css";
import { memo, ReactNode, useMemo } from "react";

import { assertGame } from "../../../functions/isGame";
import { systemLogger } from "../../../functions/utilities";
import { isClassicCombatant } from "../../../module/combat/classicCombatant";
import { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";
import { isTurnPassingCombatant } from "../../../module/combat/turnPassingCombatant";
import { NativeContextMenuWrapper } from "../../inputs/NativeMenu/NativeContextMenuWrapper";
import { ClassicInitiative } from "./ClassicInitiative";
import { Grip } from "./Grip";
import { TurnPassingInitiative } from "./TurnPassingInitiative";
import { useCombatantData } from "./useCombatantData";

interface ContentProps {
  combatant: InvestigatorCombatant;
  index: number;
  setNodeRef: (node: HTMLElement | null) => void;
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  transform: string | undefined;
  transition: string | undefined;
  listeners: SyntheticListenerMap | undefined;
}

export const Content = memo(
  ({
    combatant,
    index,
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    transform,
    transition,
    listeners,
  }: ContentProps) => {
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

    const { combatantData, effects, resource } = useCombatantData(combatant);

    const activeCombatantId =
      combat.turn !== null ? combat.turns[combat.turn].id : null;
    const active = activeCombatantId === combatant.id;
    const depleted =
      isTurnPassingCombatant(combatant) &&
      combatant.system.passingTurnsRemaining <= 0;

    // based on foundry's CombatTracker#_formatEffectsTooltip
    const effectsTooltip = useMemo(() => {
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
    }, [effects]);

    systemLogger.log("CombatantRowCOntent rendered", {});

    return (
      <NativeContextMenuWrapper>
        <li
          ref={setNodeRef}
          className={cx("combatant", {
            active: combat.turn === index,
            hide: combatantData.hidden,
            defeated: combatantData.defeated,
          })}
          {...attributes}
          data-combatant-id={combatant.id}
          style={{
            transform,
            transition,
            opacity: depleted && !active ? 0.7 : 1,
          }}
          css={{ alignItems: "start" }}
        >
          <Grip
            listeners={listeners}
            setActivatorNodeRef={setActivatorNodeRef}
          />
          <img
            className="token-image"
            src={combatantData.img || CONST.DEFAULT_TOKEN}
            alt={combatantData.name}
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
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
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
              {resource !== null && (
                <div className="token-resource">
                  <span className="resource">{resource}</span>
                </div>
              )}
              {game.user.isGM && (
                <>
                  <button
                    type="button"
                    className={cx(
                      "inline-control combatant-control icon fa-solid",
                      {
                        "fa-eye-slash active": combatantData.hidden,
                        "fa-eye": !combatantData.hidden,
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
                        active: combatantData.defeated,
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
        </li>
      </NativeContextMenuWrapper>
    );
  },
);

Content.displayName = "Content";
