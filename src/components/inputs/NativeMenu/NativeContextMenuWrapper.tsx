import * as ContextMenu from "@radix-ui/react-context-menu";
import type { PropsWithChildren } from "react";
import { memo } from "react";

export const NativeContextMenuWrapper = memo(function NativeContextMenuWrapper({
  children,
}: PropsWithChildren) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
    </ContextMenu.Root>
  );
});
