import type { PropsWithChildren } from "react";
import React, { useCallback } from "react";

import { displayText, floating } from "../styled-system/recipes";
import { css, cx } from "../styled-system/css";

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
      className={cx(floating({ kind: "chip" }), css({ padding: "0 0.5em" }))}
    >
      {/* the label's own element, so its class and the chip's can each be
        overridden without the other */}
      <span className={displayText()}>{children}</span>
    </a>
  );
};
