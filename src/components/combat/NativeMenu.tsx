import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { PropsWithChildren } from "react";

const NativeMenuItem = ({ children }: PropsWithChildren) => {
  return (
    <DropdownMenu.Item
      css={{
        border: "1px solid transparent",
        padding: "8px",
        lineHeight: "15px",
        fontSize: "var(--font-size-12)",
        cursor: "var(--cursor-pointer)",
        transition: "0.1s",
      }}
    >
      {children}
    </DropdownMenu.Item>
  );
};

export const NativeMenu = () => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>M</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          avoidCollisions={true}
          collisionBoundary={document.body}
          collisionPadding={10}
          align="start"
          side="bottom"
          className=""
          css={{
            // from .themed.theme-dark#context-menu</DropdownMenu.Portal>
            "--background-color": "var(--color-cool-5)",
            "--border-color": "var(--color-cool-3)",
            "--text-color": "var(--color-text-secondary)",
            "--hover-text-color": "var(--color-text-emphatic)",
            "--group-separator": "var(--color-cool-4)",
            "--hover-entry-border": "var(--color-cool-4)",
            "--hover-entry-background": "var(--color-dark-1)",
            // from #context-menu
            height: "max-content",
            minWidth: "150px",
            maxWidth: "360px",
            background: "var(--background-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "5px",
            color: "var(--text-color)",
            width: "100%",
            zIndex: "calc(var(--z-index-app) + 1)",
            boxShadow: "0 3px 6px rgba(0, 0, 0, 0.45)",
          }}
          // we should be able to recycle foundry's styles for #context-menu,
          // but 1. it's an id and we can in theory display >1 menu at once,
          // and 2. it applies `position: absolute`, which ballses up
          // positioning
          // id="context-menu"
        >
          <NativeMenuItem>An Item!</NativeMenuItem>
          <NativeMenuItem>Another Item!</NativeMenuItem>
          <NativeMenuItem>A third Item!</NativeMenuItem>
          <DropdownMenu.Arrow width={10} height={10} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

NativeMenu.Item = NativeMenuItem;
