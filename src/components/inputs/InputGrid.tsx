import type { CSSProperties } from "react";

import { cx } from "../../styled-system/css";
import { fieldGrid } from "../../styled-system/recipes";

type InputGridProps = {
  children: any;
  className?: string;
  style?: CSSProperties;
};

/**
 * InputGrid's classes, for an element that's also something else (a panel):
 * the fieldGrid recipe's root, for its look, and the grid's structure, an
 * overridable default (`.inv-default-input-grid`, componentDefaults.css), so
 * a theme can't change it but a caller's `css()` can.
 */
export const inputGridClassName = cx(
  fieldGrid().root,
  "inv-default-input-grid",
);

export const InputGrid = ({ children, className, style }: InputGridProps) => {
  return (
    <div className={cx(inputGridClassName, className)} style={style}>
      {children}
    </div>
  );
};
