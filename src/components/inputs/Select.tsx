import type { ComponentProps } from "react";
import { useContext } from "react";

import { useIsEditable } from "../../hooks/useIsEditable";
import { cx } from "../../styled-system/css";
import { select } from "../../styled-system/recipes";
import { IdContext } from "../IdContext";

/**
 * A `<select>` (the catalogue's `select`) which takes its id from the
 * `GridField` it's in, so the field's label is its label, and is disabled
 * where the user can't edit.
 */
export const Select = (props: ComponentProps<"select">) => {
  const id = useContext(IdContext);
  const isEditable = useIsEditable();
  return (
    <select
      id={id}
      {...props}
      className={cx(select(), props.className)}
      disabled={(props.disabled ?? false) || !isEditable}
    />
  );
};
