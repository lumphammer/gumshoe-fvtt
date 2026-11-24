import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { memo } from "react";
import { TbGripVertical } from "react-icons/tb";
import { css, cx } from "../../../styled-system/css";
import type { DraggableAttributes } from "@dnd-kit/core";
import { getTranslated } from "../../../functions/getTranslated";

interface GripProps {
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  listeners: SyntheticListenerMap | undefined;
  /**
   * dnd-kit's role, tab stop and description: on the grip, which starts a
   * drag (from the keyboard too), not the row, which holds other controls
   */
  attributes: DraggableAttributes;
}
export const Grip = memo(
  ({ listeners, attributes, setActivatorNodeRef }: GripProps) => {
    return (
      <div
        className={cx(
          "drag-handle",
          css({
            cursor: "row-resize",
          }),
        )}
        ref={setActivatorNodeRef}
        {...attributes}
        aria-label={getTranslated("Drag to reorder")}
        {...listeners}
      >
        <TbGripVertical
          className={css({
            marginTop: "calc(calc(var(--sidebar-item-height) / 2) - 6px)",
          })}
        />
      </div>
    );
  },
);

Grip.displayName = "Grip";
