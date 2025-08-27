import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { cx } from "@emotion/css";
import { memo, useMemo } from "react";

import { assertGame } from "../../../functions/isGame";
import { systemLogger } from "../../../functions/utilities";
import { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";
import { isTurnPassingCombatant } from "../../../module/combat/turnPassingCombatant";
import { NativeContextMenuWrapper } from "../../inputs/NativeMenu/NativeContextMenuWrapper";
import { BottomRow } from "./BottomRow";
import { CombatantContextProvider } from "./CombatantContext";
import { Grip } from "./Grip";
import { TopRow } from "./TopRow";
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

    systemLogger.log("CombatantRowCOntent rendered", {});

    const combatantContextValue = useMemo(
      () => ({ combatant, combatantData }),
      [combatant, combatantData],
    );

    return (
      <CombatantContextProvider value={combatantContextValue}>
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
              <TopRow />
              <BottomRow effects={effects} resource={resource} />
            </div>
          </li>
        </NativeContextMenuWrapper>
      </CombatantContextProvider>
    );
  },
);

Content.displayName = "Content";
