import type { PropsWithChildren } from "react";
import React, { useCallback, useContext } from "react";

import { ThemeContext } from "../themes/ThemeContext";

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
      css={{
        backgroundColor: theme.colors.bgOpaquePrimary,
        padding: "0 0.5em",
        borderRadius: "0.5em",
        font: theme.displayFont,
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
