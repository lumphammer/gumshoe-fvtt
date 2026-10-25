import type { ComponentProps } from "react";

type ItemNameWithIconProps = ComponentProps<"div"> & {
  item: { name: string | null; img: string | null };
};

/**
 * An item's image, small, then its name (cut off with an ellipsis if need
 * be), for the first cell of a row in a list of items
 */
export const ItemNameWithIcon = ({ item, ...rest }: ItemNameWithIconProps) => {
  // Foundry's own icons (like the stand-in for contacts) are white, made for
  // its dark UI, so they'd vanish on a light sheet
  const isFoundryIcon = item.img?.startsWith("icons/svg/") ?? false;
  return (
    <div
      css={{
        display: "flex",
        alignItems: "center",
        gap: "0.4em",
        minWidth: 0,
      }}
      {...rest}
    >
      {item.img ? (
        <img
          src={item.img}
          alt=""
          // so a drag takes the row, not just the image
          draggable={false}
          css={{
            width: "1.5em",
            height: "1.5em",
            flexShrink: 0,
            objectFit: "cover",
            border: "none",
            ...(isFoundryIcon && {
              backgroundColor: "#333",
              borderRadius: "0.2em",
              padding: "0.1em",
            }),
          }}
        />
      ) : (
        // keep the names lined up
        <span css={{ width: "1.5em", flexShrink: 0 }} />
      )}
      <span
        css={{
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {item.name}
      </span>
    </div>
  );
};

ItemNameWithIcon.displayName = "ItemNameWithIcon";
