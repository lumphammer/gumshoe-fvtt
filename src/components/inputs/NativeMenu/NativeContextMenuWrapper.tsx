import * as ContextMenu from "@radix-ui/react-context-menu";
import type { PropsWithChildren } from "react";
import { memo } from "react";

/**
 * The root of a native-style context menu. Put a `NativeContextMenuTrigger`
 * (with `asChild`, around the element to right-click) somewhere inside it.
 *
 * Memoised: if its children are a constant element, and the trigger reads
 * what changes from a context, a change re-renders only the trigger, not
 * Radix's whole menu tree.
 */
export const NativeContextMenuWrapper = memo(function NativeContextMenuWrapper({
  children,
}: PropsWithChildren) {
  "use memo";

  return <ContextMenu.Root>{children}</ContextMenu.Root>;
});

export const NativeContextMenuTrigger = ContextMenu.Trigger;
