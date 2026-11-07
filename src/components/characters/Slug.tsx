import React from "react";

import { useDragStart } from "../../hooks/useDragStart";
import { badge } from "../../styled-system/recipes";

interface SlugProps {
  onClick?: () => void;
  /** the item it stands for (e.g. from a snapshot): its id, for dragging, and its image */
  item?: { id: string | null; img: string | null };
  children?: React.ReactNode;
}

export const Slug = ({ onClick, item, children }: SlugProps) => {
  const onDragStart = useDragStart();

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
      data-interactive={onClick !== undefined || undefined}
      className={badge({ weight: "strong" })}
      css={{
        display: "block",
        // the size of the text around it, not a badge's smaller size
        fontSize: "inherit",
        padding: "0.1em 0.5em",
        margin: "0.1em 0.1em 0.1em 0",
        lineHeight: "1em",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        // width: "100%",
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
