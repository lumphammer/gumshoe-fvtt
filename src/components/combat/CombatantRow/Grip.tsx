import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { memo } from "react";
import { TbGripVertical } from "react-icons/tb";
import { css, cx } from "../../../styled-system/css";

interface GripProps {
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  listeners: SyntheticListenerMap | undefined;
}
export const Grip = memo(({ listeners, setActivatorNodeRef }: GripProps) => {
  return (
    <div
      className={cx(
        "drag-handle",
        css({
          cursor: "row-resize",
        }),
      )}
      ref={setActivatorNodeRef}
      {...listeners}
    >
      <TbGripVertical
        className={css({
          marginTop: "calc(calc(var(--sidebar-item-height) / 2) - 6px)",
        })}
      />
    </div>
  );
});

Grip.displayName = "Grip";
