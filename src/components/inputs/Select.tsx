import type { ComponentProps } from "react";
import { useContext } from "react";

import { IdContext } from "../IdContext";

/**
 * A `<select>` which takes its id from the `GridField` it's in, so the field's
 * label is its label.
 */
export const Select = (props: ComponentProps<"select">) => {
  const id = useContext(IdContext);
  return <select id={id} {...props} />;
};
