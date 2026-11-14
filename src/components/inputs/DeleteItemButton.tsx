import type { ComponentProps } from "react";

import { confirmAndDeleteItem } from "../../functions/confirmAndDeleteItem";
import { getTranslated } from "../../functions/getTranslated";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { Button } from "./Button";
import { css, cx } from "../../styled-system/css";

type DeleteItemButtonProps = Omit<ComponentProps<"button">, "onClick"> & {
  item: InvestigatorItem;
};

/**
 * A small trash-can button for a row in a list of items, which deletes the
 * item after confirming
 */
export const DeleteItemButton = ({
  item,
  className,
  ...rest
}: DeleteItemButtonProps) => {
  const label = getTranslated("Delete");
  return (
    <Button
      kind="ghost"
      aria-label={label}
      title={label}
      {...rest}
      className={cx(
        css({
          alignSelf: "center",
          "&&": { width: "auto" },
          padding: "0 0.3em",
          margin: "0.1em 0",
          lineHeight: 1.4,
        }),
        className,
      )}
      onClick={() => void confirmAndDeleteItem(item)}
    >
      <i className="fa fa-trash" />
    </Button>
  );
};

DeleteItemButton.displayName = "DeleteItemButton";
