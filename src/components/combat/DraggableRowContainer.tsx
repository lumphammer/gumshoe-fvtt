import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { InvestigatorCombat } from "../../module/combat/InvestigatorCombat";
import { CombatantRow } from "./CombatantRow";

export const DraggableRowContainer = () => {
  const combat = game.combats?.active as InvestigatorCombat | undefined;

  if (combat === undefined) {
    throw new Error("No active combat found");
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      //
    }
  }

  const ids = combat.turns.map((turn) => turn.id).filter((id) => id !== null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext
        items={ids}
        strategy={verticalListSortingStrategy}
        // strategy={rectSwappingStrategy}
      >
        <ol
          // see investigator-combatant-list in the LESS for why we add this class
          className="plain investigator-combatant-list"
          css={{
            position: "relative",
            flex: 1,
            // height: `${combat.turns.length * 4}em`,
            overflow: "hidden",
          }}
        >
          {
            // combatant sorting is done in "Combat" but for rendering stability
            // we need to un-sort the combatants and then tell each row where it
            // used to exist in the order
            combat.turns.map((combatant) => (
              <CombatantRow
                key={combatant.id}
                index={combat.turns.findIndex((x) => x.id === combatant.id)}
                combatant={combatant}
              />
            ))
          }
        </ol>
      </SortableContext>
    </DndContext>
  );
};
