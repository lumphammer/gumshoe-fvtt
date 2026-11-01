import type { AnimateLayoutChanges } from "@dnd-kit/sortable";
import { defaultAnimateLayoutChanges, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cx } from "@emotion/css";
import { memo, useContext } from "react";

import { assertGame } from "../../../functions/isGame";
import type { InvestigatorCombatant } from "../../../module/combat/InvestigatorCombatant";
import { isTurnPassingCombatant } from "../../../module/combat/turnPassingCombatant";
import { NativeContextMenuWrapper } from "../../inputs/NativeMenu/NativeContextMenuWrapper";
import {
  CombatantContextProvider,
  useCombatantContextValue,
} from "./CombatantContext";
import {
  CombatantActiveContext,
  CombatRoundContext,
} from "./CombatantTurnContext";
import { Content } from "./Content";

interface CombatantRowProps {
  combatant: InvestigatorCombatant;
  /** Whether it's this combatant's turn. */
  active: boolean;
}

// https://github.com/clauderic/dnd-kit/discussions/684#discussioncomment-2462985
const customAnimateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

const customTransition = {
  duration: 400,
  easing: "linear",
};

export const CombatantRow = memo(({ combatant, active }: CombatantRowProps) => {
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

  const combatantContextValue = useCombatantContextValue(combatant);

  // turns remaining depend on the round, which a memoised row would
  // otherwise miss (going back to a round already played updates no
  // combatants)
  useContext(CombatRoundContext);
  const depleted =
    isTurnPassingCombatant(combatant) &&
    combatant.system.passingTurnsRemaining <= 0;

  return (
    <CombatantContextProvider value={combatantContextValue}>
      <CombatantActiveContext.Provider value={active}>
        <NativeContextMenuWrapper>
          <li
            ref={setNodeRef}
            className={cx("combatant", {
              active,
              hide: combatantContextValue.combatantState.hidden,
              defeated: combatantContextValue.combatantState.defeated,
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
            {/* the row content is pushed down so it can memoise even if the draggable
          hook is updating very frequently */}
            <Content
              setActivatorNodeRef={setActivatorNodeRef}
              listeners={listeners}
            />
          </li>
        </NativeContextMenuWrapper>
      </CombatantActiveContext.Provider>
    </CombatantContextProvider>
  );
});

CombatantRow.displayName = "CombatantRow";
