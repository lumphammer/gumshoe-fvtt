import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PropsWithChildren } from "react";
import { useContext } from "react";

import { DragHandle } from "../settings/DragDrop/DragHandle";
import { ActiveIdContext } from "./ActiveIdContext";

type SortableRowProps = PropsWithChildren<{
  id: string;
}>;

export const SortableRow = ({ children, id }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
  } = useSortable({ id });

  const active = useContext(ActiveIdContext) === id;

  return (
    <div
      css={{
        display: "grid",
        gridTemplateColumns: "subgrid",
        gridColumn: "1/-1",
        opacity: active ? 0.5 : 1,
      }}
      {...attributes}
      tabIndex={undefined}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <DragHandle
        setActivatorNodeRef={setActivatorNodeRef}
        listeners={listeners}
      />
      <div
        css={{
          display: "grid",
          gridTemplateColumns: "subgrid",
          gridColumn: "2/-1",
        }}
      >
        {children}
      </div>
    </div>
  );
};
