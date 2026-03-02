import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MeasuringConfiguration,
  MeasuringStrategy,
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
import { memo, useCallback, useEffect, useState } from "react";

import { isClassicCombat } from "../../module/combat/classicCombat";
import { CombatantRow } from "./CombatantRow/CombatantRow";
import { useTrackerContext } from "./TrackerContext";

// https://github.com/clauderic/dnd-kit/discussions/684#discussioncomment-2462985
const measuringConfig: MeasuringConfiguration = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

export const CombatantList = memo(function CombatantList() {
  const { combat, turnIds } = useTrackerContext();

  if (combat === null) {
    throw new Error("No active combat found");
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // ids is local state so the tracker can respond immediately to drag-n-drop
  // changes, rather than waiting for the combat to update and the turn
  // order to be re-calculated
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(turnIds);
  }, [turnIds]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!isClassicCombat(combat)) {
        return;
      }
      const {
        active,
        over,
        delta: { y },
      } = event;
      // event.
      if (over === null) return;
      if (active.id !== over.id) {
        void combat?.system.moveCombatant(
          active.id.toString(),
          over.id.toString(),
          y < 0 ? "up" : "down",
        );
      }
      const newIds = ids.filter((id) => id !== active.id);
      const modifier = y < 0 ? 0 : 1;
      const insertionIndex = newIds.indexOf(over.id.toString()) + modifier;
      newIds.splice(insertionIndex, 0, active.id.toString());
      setIds(newIds);
    },
    [combat, ids],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      measuring={measuringConfig}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {/* we need to wrap the actual tracker ol in another element so that
          foundry's autosizing works */}
        <div
          className="combat-tracker"
          css={{
            flex: 1,
          }}
        >
          <ol
            // see investigator-combatant-list in the LESS for why we add this class
            className="plain investigator-combatant-list"
            css={{
              position: "relative",
              flex: 1,
            }}
          >
            {ids.map((id) => {
              const combatant = combat.turns.find((x) => x.id === id);
              if (!combatant) return null;
              return (
                <CombatantRow
                  key={id}
                  index={combat.turns.findIndex((x) => x.id === id)}
                  combatant={combatant}
                />
              );
            })}
          </ol>
        </div>
      </SortableContext>
    </DndContext>
  );
});
