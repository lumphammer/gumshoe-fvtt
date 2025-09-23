import {
  AnimateLayoutChanges,
  defaultAnimateLayoutChanges,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cx } from "@emotion/css";
import { memo, useMemo } from "react";

import { assertGame } from "../../../functions/isGame";
import { systemLogger } from "../../../functions/utilities";
import { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";
import { isTurnPassingCombatant } from "../../../module/combat/turnPassingCombatant";
import { NativeContextMenuWrapper } from "../../inputs/NativeMenu/NativeContextMenuWrapper";
import { CombatantContextProvider } from "./CombatantContext";
import { Content } from "./Content";
import { useCombatantData } from "./useCombatantData";

interface CombatantRowProps {
  combatant: InvestigatorCombatant;
  index: number;
}

// https://github.com/clauderic/dnd-kit/discussions/684#discussioncomment-2462985
const customAnimateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

const customTransition = { duration: 300, easing: "linear" };

export const CombatantRow = memo(({ combatant, index }: CombatantRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
  } = useSortable({
    id: combatant.id ?? "",
    transition: customTransition,
    animateLayoutChanges: customAnimateLayoutChanges,
  });

  systemLogger.log("CombatantRow rendered", {
    attributes,
    transform,
    transition,
  });

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

  const combatantContextValue = useMemo(
    () => ({ combatant, combatantData, effects, resource }),
    [combatant, combatantData, effects, resource],
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
            transform: CSS.Translate.toString(transform),
            transition,
            opacity: depleted && !active ? 0.7 : 1,
          }}
          css={{ alignItems: "start" }}
        >
          {/* // the row content is pushed down so it can memoise even if the draggable
        // hook is updating very frequently */}
          <Content
            setActivatorNodeRef={setActivatorNodeRef}
            listeners={listeners}
          />
        </li>
      </NativeContextMenuWrapper>
    </CombatantContextProvider>
  );
});

CombatantRow.displayName = "CombatantRow";
