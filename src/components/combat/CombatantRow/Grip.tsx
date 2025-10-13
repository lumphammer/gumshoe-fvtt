import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { memo } from "react";
import { TbGripVertical } from "react-icons/tb";

interface GripProps {
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  listeners: SyntheticListenerMap | undefined;
}
export const Grip = memo(({ listeners, setActivatorNodeRef }: GripProps) => {
  return (
    <div
      className="drag-handle"
      ref={setActivatorNodeRef}
      {...listeners}
      css={{
        cursor: "row-resize",
      }}
    >
      <TbGripVertical
        css={{
          marginTop: "calc(calc(var(--sidebar-item-height) / 2) - 6px)",
        }}
      />
    </div>
  );
});

Grip.displayName = "Grip";
