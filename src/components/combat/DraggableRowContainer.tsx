import {
  closestCenter,
  DndContext,
  DragEndEvent,
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

import { systemLogger } from "../../functions/utilities";
import { InvestigatorCombat } from "../../module/combat/InvestigatorCombat";
import { CombatantRow } from "./CombatantRow/CombatantRow";

// https://github.com/clauderic/dnd-kit/discussions/684#discussioncomment-2462985
const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

export const DraggableRowContainer = memo(() => {
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

  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(combat.turns.map((turn) => turn.id).filter((id) => id !== null));
    const handleUpdateCombat = (
      updatedCombat: InvestigatorCombat,
      changes: Combat.UpdateData,
      options: Combat.Database.UpdateOptions,
      userId: string,
    ) => {
      if (updatedCombat.id !== combat.id) return;
      setIds(
        updatedCombat.turns.map((turn) => turn.id).filter((id) => id !== null),
      );
    };
    Hooks.on("updateCombat", handleUpdateCombat);
    return () => {
      Hooks.off("updateCombat", handleUpdateCombat);
    };
  }, [combat]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const {
        active,
        over,
        delta: { y },
      } = event;
      // event.
      if (over === null) return;
      systemLogger.log("Drag ended", { active, over });
      if (active.id !== over.id) {
        void combat?.swapCombatants(
          active.id.toString(),
          over.id.toString(),
          y < 0 ? "up" : "down",
        );
      }
      const newIds = ids.filter((id) => id !== active.id);
      const modifier = y < 0 ? 0 : 1;
      const insertionIndex = newIds.indexOf(over.id.toString()) + modifier;
      newIds.splice(insertionIndex, 0, active.id.toString());

      systemLogger.log("New IDs", { newIds });
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
      <SortableContext
        items={ids}
        strategy={verticalListSortingStrategy}
        // strategy={rectSwappingStrategy}
      >
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
            {
              // combatant sorting is done in "Combat" but for rendering stability
              // we need to un-sort the combatants and then tell each row where it
              // used to exist in the order
              ids.map((id) => {
                const combatant = combat.turns.find((x) => x.id === id);
                if (!combatant) return null;
                return (
                  <CombatantRow
                    key={id}
                    index={combat.turns.findIndex((x) => x.id === id)}
                    combatant={combatant}
                  />
                );
              })
            }
          </ol>
        </div>
      </SortableContext>
    </DndContext>
  );
});

DraggableRowContainer.displayName = "DraggableRowContainer";
