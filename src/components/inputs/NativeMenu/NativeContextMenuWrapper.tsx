import * as ContextMenu from "@radix-ui/react-context-menu";
import { memo, PropsWithChildren } from "react";

export const NativeContextMenuWrapper = memo(function NativeContextMenuWrapper({
  children,
}: PropsWithChildren) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
    </ContextMenu.Root>
  );
});
