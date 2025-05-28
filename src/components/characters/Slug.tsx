import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, { useCallback, useContext } from "react";

import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { ThemeContext } from "../../themes/ThemeContext";

interface SlugProps {
  onClick?: () => void;
  item?: InvestigatorItem;
  children?: React.ReactNode;
}

export const Slug = ({ onClick, item, children }: SlugProps) => {
  const app = useContext(FoundryAppContext);
  const theme = useContext(ThemeContext);
  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLAnchorElement>) => {
      if (app !== null) {
        (app as any)._onDragStart(e);
      }
    },
    [app],
  );

  return (
    <a
      onClick={() => {
        if (onClick !== undefined) {
          onClick();
        }
      }}
      data-item-id={item?.id}
      onDragStart={onDragStart}
      draggable="true"
      css={{
        display: "block",
        borderRadius: "0.7em",
        padding: "0.1em 0.5em",
        margin: "0.1em 0.1em 0.1em 0",
        backgroundColor: theme.colors.backgroundButton,
        color: theme.colors.accent,
        lineHeight: "1em",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        // width: "100%",
        borderStyle: "solid",
        borderWidth: "1px",
        borderColor: theme.colors.accent,
        flex: 1,
        minWidth: "max-content",
      }}
    >
      {item && (
        <div
          css={{
            display: "inline-block",
            height: "1em",
            width: "1em",
            marginRight: "0.5em",

            backgroundImage: `url(${item.img})`,
            backgroundSize: "cover",
          }}
        />
      )}
      {children}
    </a>
  );
};

Slug.displayName = "Slug";
