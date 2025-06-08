import * as ContextMenu from "@radix-ui/react-context-menu";
import { PropsWithChildren } from "react";

export const NativeContextMenuWrapper = ({ children }: PropsWithChildren) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
    </ContextMenu.Root>
  );
};
