import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { FaGripLines } from "react-icons/fa6";

import { getTranslated } from "../../functions/getTranslated";
import { dragHandle } from "../../styled-system/recipes";

type DragHandleProps = {
  setActivatorNodeRef?: (node: HTMLDivElement) => void;
  listeners?: SyntheticListenerMap | undefined;
  /** dnd-kit's attributes (role, description etc.) for the handle */
  attributes?: DraggableAttributes;
};

export const DragHandle = ({
  setActivatorNodeRef,
  listeners,
  attributes,
}: DragHandleProps) => {
  return (
    <div
      tabIndex={0}
      {...attributes}
      aria-label={getTranslated("Drag to reorder")}
      className={dragHandle()}
      css={{
        height: "100%",
        width: "3em",
        textAlign: "center",
        gridColumn: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      ref={setActivatorNodeRef}
      {...listeners}
    >
      <FaGripLines />
    </div>
  );
};
