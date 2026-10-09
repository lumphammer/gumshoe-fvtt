import type { ComponentProps } from "react";
import { useContext } from "react";

import { useIsEditable } from "../../hooks/useIsEditable";
import { IdContext } from "../IdContext";

/**
 * A `<select>` which takes its id from the `GridField` it's in, so the field's
 * label is its label, and is disabled where the user can't edit.
 */
export const Select = (props: ComponentProps<"select">) => {
  const id = useContext(IdContext);
  const isEditable = useIsEditable();
  return (
    <select
      id={id}
      {...props}
      disabled={(props.disabled ?? false) || !isEditable}
    />
  );
};
