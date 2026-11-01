import type { DragEndEvent, MeasuringConfiguration } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
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
import { CombatRoundContext } from "./CombatantRow/CombatantTurnContext";
import { useTrackerContext } from "./TrackerContext";

// https://github.com/clauderic/dnd-kit/discussions/684#discussioncomment-2462985
const measuringConfig: MeasuringConfiguration = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

// kept stable: a new options object makes new sensors, which gives every row
// new drag listeners, so every row's content re-renders
const keyboardSensorOptions = {
  coordinateGetter: sortableKeyboardCoordinates,
};

export const CombatantList = memo(function CombatantList() {
  const { combat, combatState, turnIds } = useTrackerContext();

  if (combat === null) {
    throw new Error("No active combat found");
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, keyboardSensorOptions),
  );

  // ids is local state so the tracker can respond immediately to drag-n-drop
  // changes, rather than waiting for the combat to update and the turn
  // order to be re-calculated
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    setIds(turnIds);
  }, [turnIds]);

  const activeId =
    combat.turn !== null ? (combat.turns[combat.turn]?.id ?? null) : null;

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
      <CombatRoundContext.Provider value={combatState?.round ?? 0}>
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
                    // rows are memoised, so whose turn it is comes from here
                    active={activeId === id}
                    combatant={combatant}
                  />
                );
              })}
            </ol>
          </div>
        </SortableContext>
      </CombatRoundContext.Provider>
    </DndContext>
  );
});
