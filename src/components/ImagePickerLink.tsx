import type { PropsWithChildren } from "react";
import React, { useCallback, useContext } from "react";

import { ThemeContext } from "../themes/ThemeContext";
import { displayText } from "../styled-system/recipes";

type ImagePickerLinkProps = PropsWithChildren<{
  onClick: () => void;
}>;

export const ImagePickerLink = ({
  onClick,
  children,
}: ImagePickerLinkProps) => {
  const theme = useContext(ThemeContext);

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
      className={displayText()}
      css={{
        backgroundColor: theme.colors.bgOpaquePrimary,
        padding: "0 0.5em",
        borderRadius: "0.5em",
        transition: "background-color 0.2s",
        ":hover": {
          backgroundColor: theme.colors.backgroundPrimary,
        },
      }}
    >
      {children}
    </a>
  );
};
