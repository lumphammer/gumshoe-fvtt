import type { ComponentProps } from "react";
import { css, cx } from "../../styled-system/css";

type ItemNameWithIconProps = ComponentProps<"div"> & {
  item: { name: string | null; img: string | null };
};

/**
 * An item's image, small, then its name (cut off with an ellipsis if need
 * be), for the first cell of a row in a list of items
 */
export const ItemNameWithIcon = ({
  item,
  className,
  ...rest
}: ItemNameWithIconProps) => {
  return (
    <div
      {...rest}
      // with the caller's, as Emotion merged them; layout, which call sites
      // can change (componentDefaults.css)
      className={cx("inv-default-item-name-with-icon", className)}
    >
      {item.img ? (
        <img
          src={item.img}
          alt=""
          // so a drag takes the row, not just the image
          draggable={false}
          className={css({
            width: "1.5em",
            height: "1.5em",
            flexShrink: 0,
            objectFit: "cover",
            border: "none",
          })}
        />
      ) : (
        // keep the names lined up
        <span className={css({ width: "1.5em", flexShrink: 0 })} />
      )}
      <span
        className={css({
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        })}
      >
        {item.name}
      </span>
    </div>
  );
};

ItemNameWithIcon.displayName = "ItemNameWithIcon";
