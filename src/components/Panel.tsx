import { type ComponentProps } from "react";

import { cx } from "../styled-system/css";
import { panel } from "../styled-system/recipes";

/**
 * A box of controls or content (the catalogue's `panel`). It goes inside a
 * `<Region>` or a tab's content, never straight on the wallpaper.
 */
export const Panel = ({ className, ...rest }: ComponentProps<"div">) => (
  <div {...rest} className={cx(panel(), className)} />
);
