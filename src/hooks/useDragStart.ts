import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import type React from "react";
import { useCallback, useContext } from "react";

type DragStarter = { _onDragStart: (event: React.DragEvent) => void };

/**
 * A drag start handler which hands the drag to the sheet, so Foundry gives it
 * the document's drag data (from the element's `data-item-id` and the like),
 * and it can be dropped on other sheets.
 */
export function useDragStart(): (event: React.DragEvent<HTMLElement>) => void {
  const app = useContext(FoundryAppContext);
  return useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      if (app !== null) (app as unknown as DragStarter)._onDragStart(event);
    },
    [app],
  );
}
