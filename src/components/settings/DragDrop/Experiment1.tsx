import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { produce } from "immer";
import type { CSSProperties, PropsWithChildren } from "react";
import React, { forwardRef, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";

import { ThemeContext } from "../../../themes/ThemeContext";
import { CSSReset } from "../../CSSReset";

/// ////////////////////////////////////////////////////////////////////////////
// a playground for learning dnd-kit
// I'm leaving this in here for the time being while I work on draggable rows
// but it can be deleted once I'm done.
/// ////////////////////////////////////////////////////////////////////////////

type RowProps = PropsWithChildren<{
  isDragging: boolean;
  // we have to pass in this ref for the activator node (aka drag handle)
  activatorNodeRef?: React.RefCallback<HTMLDivElement>;
}>;

/**
 * Display component for a row
 */
const Row = forwardRef<HTMLDivElement, RowProps>(
  ({ children, isDragging, activatorNodeRef }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          padding: "1em",
          border: "1px solid black",
          backgroundColor: isDragging ? "#efe" : "white",
        }}
      >
        <div
          css={{ backgroundColor: "grey", cursor: "grab" }}
          ref={activatorNodeRef}
        >
          Drag
        </div>
        {children}
      </div>
    );
  },
);

Row.displayName = "Row";

/**
 * A draggable row
 */
function Draggable({ id, children }: PropsWithChildren<{ id: string }>) {
  const { attributes, listeners, setNodeRef, isDragging, setActivatorNodeRef } =
    useDraggable({
      id,
    });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      <Row isDragging={isDragging} activatorNodeRef={setActivatorNodeRef}>
        ORIGINAL {children}
      </Row>
    </div>
  );
}

/**
 * A droppable area
 */
function Droppable({ children, id }: PropsWithChildren<{ id: string }>) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });
  const style: CSSProperties = {
    padding: "1em",
    border: "1px solid black",
    backgroundColor: isOver ? "#efe" : "#fff",
    color: isOver ? "green" : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
}

type DroppableKey = "a" | "b";

function assertDroppablekey(key: string): asserts key is DroppableKey {
  if (!["a", "b"].includes(key)) {
    throw new Error("Not a droppable key");
  }
}

/**
 * The main component for the experiment
 *
 * Uses a drag overlay, activator nodes (aka drag handles), and two drop
 * targets.
 */
export const Experiment1 = () => {
  // state is two buckets of strings
  const [state, setState] = useState({
    a: ["foo", "bar", "baz"],
    b: ["corge", "grault", "garply"],
  });
  // the id of the item that's currently being dragged
  const [activeId, setActiveId] = useState<string | null>(null);
  // theme from context
  const theme = useContext(ThemeContext);

  // when dragging starts, remember the active Id
  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(active?.id.toString());
  }, []);

  // when dragging ends...
  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    const dragId = active?.id.toString();
    const dropId = over?.id.toString();
    /// unset the active id
    setActiveId(null);

    if (dropId === undefined) {
      return;
    }

    // this is just for type safety
    assertDroppablekey(dropId);

    // munge the state to put the dropped key in the right bucket
    setState((s) => {
      const loserId = dropId === "a" ? "b" : "a";
      return produce(s, (draft) => {
        draft[loserId] = draft[loserId].filter((id) => id !== dragId);
        if (!draft[dropId].includes(dragId)) {
          draft[dropId].unshift(dragId);
        }
      });
    });
  }, []);

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      modifiers={[restrictToVerticalAxis]}
    >
      {Object.entries(state).map(([id, items]) => (
        <Droppable key={id} id={id}>
          <h2>{id}</h2>
          {items.map((item) => {
            // we need to unmount the entire Draggable to get the DragOverlay
            // to work right
            if (item === activeId) {
              return null;
            }
            return (
              <Draggable key={item} id={item}>
                {item}
              </Draggable>
            );
          })}
          {items.length === 0 && (
            <div>
              <i>Empty</i>
            </div>
          )}
        </Droppable>
      ))}
      {createPortal(
        <DragOverlay>
          {activeId ? (
            <CSSReset
              theme={theme}
              mode="none"
              css={{
                padding: 0,
              }}
            >
              <Row isDragging>DRAG OVERLAY{`Item ${activeId}`}</Row>
            </CSSReset>
          ) : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
};
