import { cx } from "@emotion/css";
import * as ContextMenu from "@radix-ui/react-context-menu";

import { useLocalFoundryTheme } from "../../../hooks/useLocalFoundryTheme";
import { nativeMenuContentStyles } from "./nativeMenuContentStyles";
import { NativeMenuKindProvider } from "./NativeMenuKindContext";

export const NativeContextMenuContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [theme, ref] = useLocalFoundryTheme();
  return (
    <NativeMenuKindProvider kind="context">
      <span ref={ref} css={{ display: "none" }} />
      <ContextMenu.Portal>
        <ContextMenu.Content
          className={cx("themed", theme, nativeMenuContentStyles)}
        >
          {children}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </NativeMenuKindProvider>
  );
};
