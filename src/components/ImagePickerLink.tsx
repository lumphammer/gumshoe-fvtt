import type { PropsWithChildren } from "react";
import React, { useCallback } from "react";

import { displayText, floating } from "../styled-system/recipes";
import { cx } from "../styled-system/css";

type ImagePickerLinkProps = PropsWithChildren<{
  onClick: () => void;
}>;

export const ImagePickerLink = ({
  onClick,
  children,
}: ImagePickerLinkProps) => {
  const onClickCb = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      e.stopPropagation();
      onClick();
    },
    [onClick],
  );

  return (
    <a
      onClick={onClickCb}
      className={cx(displayText(), floating({ kind: "chip" }))}
      css={{ padding: "0 0.5em" }}
    >
      {children}
    </a>
  );
};
