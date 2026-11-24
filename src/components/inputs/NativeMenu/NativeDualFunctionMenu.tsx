import type { PropsWithChildren } from "react";

import { NativeContextMenuContent } from "./NativeContextMenuContent";
import { NativeDropdownMenu } from "./NativeDropdownMenu";

type NativeDualFunctionMenuProps = PropsWithChildren<{
  className?: string;
  label?: React.ReactNode;
  ariaLabel?: string;
}>;

export const NativeDualFunctionMenu = ({
  children,
  className,
  label,
  ariaLabel,
}: NativeDualFunctionMenuProps) => {
  return (
    <>
      <NativeDropdownMenu
        className={className}
        label={label}
        ariaLabel={ariaLabel}
      >
        {children}
      </NativeDropdownMenu>
      <NativeContextMenuContent>{children}</NativeContextMenuContent>
    </>
  );
};
