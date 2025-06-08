import * as ContextMenu from "@radix-ui/react-context-menu";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { useNativeMenuKind } from "./NativeMenuKindContext";

type NativeMenuItemProps = {
  children: React.ReactNode;
  onSelect: (event: Event) => void;
  icon?: React.ReactNode;
};

export const NativeMenuItem = ({
  children,
  onSelect,
  icon,
}: NativeMenuItemProps) => {
  const menuKind = useNativeMenuKind();
  const MenuItem =
    menuKind === "dropdown" ? DropdownMenu.Item : ContextMenu.Item;

  return (
    <MenuItem
      css={{
        border: "1px solid transparent",
        padding: "8px",
        lineHeight: "15px",
        fontSize: "var(--font-size-12)",
        cursor: "var(--cursor-pointer)",
        transition: "0.1s",
        display: "grid",
        gridTemplateColumns: "subgrid",
        gridColumn: "1/-1",
        columnGap: "0.5em",
        ":hover": {
          border: "1px solid var(--hover-entry-border)",
          background: "var(--hover-entry-background)",
          color: "var(--hover-text-color)",
        },
      }}
      onSelect={onSelect}
    >
      <span css={{ marginRight: "0.5em" }}>{icon}</span>
      {children}
    </MenuItem>
  );
};
