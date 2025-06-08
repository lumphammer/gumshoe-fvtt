import { PropsWithChildren } from "react";

import { NativeContextMenuContent } from "./NativeContextMenuContent";
import { NativeDropdownMenu } from "./NativeDropdownMenu";

type NativeDualFunctionMenuProps = PropsWithChildren<{
  className?: string;
  label?: React.ReactNode;
}>;

export const NativeDualFunctionMenu = ({
  children,
  className,
  label,
}: NativeDualFunctionMenuProps) => {
  return (
    <>
      <NativeDropdownMenu className={className} label={label}>
        {children}
      </NativeDropdownMenu>
      <NativeContextMenuContent>{children}</NativeContextMenuContent>
    </>
  );
};
