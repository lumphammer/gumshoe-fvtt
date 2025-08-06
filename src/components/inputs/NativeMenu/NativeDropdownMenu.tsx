import { cx } from "@emotion/css";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FaEllipsisV } from "react-icons/fa";

import { useLocalFoundryTheme } from "../../../hooks/useLocalFoundryTheme";
import { nativeMenuContentStyles } from "./nativeMenuContentStyles";
import { NativeMenuKindProvider } from "./NativeMenuKindContext";

type NativeDropdownMenuProps = {
  className?: string;
  children: React.ReactNode;
  label?: React.ReactNode;
};

export const NativeDropdownMenu = ({
  className,
  children,
  label,
}: NativeDropdownMenuProps) => {
  const [theme, ref] = useLocalFoundryTheme();

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className={cx("inline-control", className)}>
        {label ?? <FaEllipsisV />}
      </DropdownMenu.Trigger>

      <NativeMenuKindProvider kind="dropdown">
        <span ref={ref} css={{ display: "none" }} />
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            avoidCollisions
            collisionBoundary={document.body}
            collisionPadding={10}
            align="center"
            side="bottom"
            className={cx("themed", theme, nativeMenuContentStyles)}
            // we should be able to recycle foundry's styles for #context-menu,
            // but 1. it's an id and we can in theory display >1 menu at once,
            // and 2. it applies `position: absolute`, which ballses up
            // positioning
            // id="context-menu"
          >
            {children}
            <DropdownMenu.Arrow
              width={10}
              height={10}
              css={{ fill: "var(--border-color)" }}
            />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </NativeMenuKindProvider>
    </DropdownMenu.Root>
  );
};
