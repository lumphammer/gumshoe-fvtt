import { type ComponentProps } from "react";

import { cx } from "../styled-system/css";
import { region } from "../styled-system/recipes";

/**
 * An area of a sheet's layout (the catalogue's `region`): what a sheet's
 * content sits in. Regions don't nest; boxes inside one are `<Panel>`s.
 */
export const Region = ({ className, ...rest }: ComponentProps<"div">) => (
  <div {...rest} className={cx(region(), className)} />
);
