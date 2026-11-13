import type { CSSProperties } from "react";

import { cx } from "../../styled-system/css";
import { fieldGrid } from "../../styled-system/recipes";

type InputGridProps = {
  children: any;
  className?: string;
  style?: CSSProperties;
};

/**
 * The grid's structure, for an element that's also something else (a panel),
 * which applies `fieldGrid().root` too, for its look. The same as
 * `.inv-default-input-grid` (componentDefaults.css), which InputGrid uses, so
 * callers can change it.
 */
export const inputGridStyle = {
  display: "grid",
  gridTemplateRows: "auto",
  gridTemplateColumns: "[label] fit-content(50%) [control] 1fr [end]",
  gridAutoRows: "auto",
} as const;

export const InputGrid = ({ children, className, style }: InputGridProps) => {
  return (
    <div
      className={cx(fieldGrid().root, "inv-default-input-grid", className)}
      style={style}
    >
      {children}
    </div>
  );
};
