import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  DragOverlay,
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import React, { useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";

import { ThemeContext } from "../../themes/ThemeContext";
import { absoluteCover } from "../absoluteCover";
import { Translate } from "../Translate";
import { ActiveIdContext } from "./ActiveIdContext";
import { SortableRow } from "./SortableRow";

type Header = {
  id: string;
  /** translated for display; leave empty for no header text */
  label: string;
};

type SortableTableProps = {
  items: string[];
  setItems: (items: string[]) => void;
  renderItem: (id: string) => React.ReactNode;
  headers: Header[];
  gridTemplateColumns?: string;
  className?: string;
  emptyMessage?: React.ReactNode;
};

export const SortableTable = ({
  items,
  setItems,
  renderItem,
  headers,
  gridTemplateColumns = "1fr",
  className,
  emptyMessage,
}: SortableTableProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveId(event.active.id.toString());
    },
    [setActiveId],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!active || !over) {
        return;
      }
      setActiveId(null);

      if (active.id !== over.id) {
        const oldIndex = items.indexOf(active.id.toString());
        const newIndex = items.indexOf(over.id.toString());
        setItems(arrayMove(items, oldIndex, newIndex));
      }
    },
    [items, setItems],
  );

  const {
    colors: { controlBorder },
  } = useContext(ThemeContext);

  if (items.length === 0 && emptyMessage) {
    return emptyMessage;
  }

  return (
    <div
      className={`sortable-table ${className}`}
      css={{ ...absoluteCover, padding: "1em" }}
    >
      <ActiveIdContext.Provider value={activeId}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {createPortal(<DragOverlay />, document.body)}
            <div
              css={{
                display: "grid",
                gridTemplateColumns: `max-content ${gridTemplateColumns}`,
                gap: "0.5em",
              }}
            >
              {headers.length > 0 && (
                <div
                  css={{
                    gridColumn: "1/-1",
                    display: "grid",
                    gridTemplateColumns: "subgrid",
                    borderBottom: `1px solid ${controlBorder}`,
                  }}
                >
                  <div />
                  {headers.map((header) => (
                    <div key={header.id}>
                      {header.label && <Translate>{header.label}</Translate>}
                    </div>
                  ))}
                </div>
              )}
              {items.map((id) => (
                <SortableRow key={id} id={id}>
                  {renderItem(id)}
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </ActiveIdContext.Provider>
    </div>
  );
};

SortableTable.displayName = "SortableTable";
