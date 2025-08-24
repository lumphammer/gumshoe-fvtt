import {
  AnimateLayoutChanges,
  defaultAnimateLayoutChanges,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo } from "react";

import { systemLogger } from "../../functions/utilities";
import { InvestigatorCombatant } from "../../module/combat/InvestigatorCombatant";
import { CombatantRowContent } from "./CombatantRowContent";

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

  // const [combatantData, setCombatantData] = useState(combatant._source);

  return (
    // the row content is pushed down so it can memoise even if the draggable
    // hook is updating very frequently
    <CombatantRowContent
      combatant={combatant}
      index={index}
      setNodeRef={setNodeRef}
      setActivatorNodeRef={setActivatorNodeRef}
      attributes={attributes}
      transform={CSS.Translate.toString(transform)}
      transition={transition}
      listeners={listeners}
    />
  );
});

CombatantRow.displayName = "CombatantRow";
