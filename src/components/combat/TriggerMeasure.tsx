import { useDndContext } from "@dnd-kit/core";
import { memo, useLayoutEffect } from "react";

import { systemLogger } from "../../functions/utilities";

export const TriggerMeasure = memo(
  function TriggerRender({ ids }: { ids: string[] }) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { measureDroppableContainers, droppableContainers, droppableRects } =
      useDndContext();
    systemLogger.log("Triggering re-measure of droppables", {
      ids,
      droppableRects,
      droppableContainers,
    });
    useLayoutEffect(() => {
      if (ids.length === 0) return;
      requestAnimationFrame(() => {
        // measureDroppableContainers(ids);
      });
      //
      // measureDroppableContainers(ids);
    }, [ids, measureDroppableContainers]);

    return null;
  },
  function areEqual(prevProps, nextProps) {
    if (prevProps.ids.length !== nextProps.ids.length) return false;
    for (let i = 0; i < prevProps.ids.length; i++) {
      if (prevProps.ids[i] !== nextProps.ids[i]) return false;
    }
    return true;
  },
);
