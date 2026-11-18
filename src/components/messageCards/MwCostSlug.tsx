import type { ReactNode } from "react";
import { css } from "../../styled-system/css";
type MwCostSlugProps = {
  children: ReactNode;
};

export const MwCostSlug = ({ children }: MwCostSlugProps) => {
  return (
    <span
      className={css({
        backgroundColor: "[#0007]",
        color: "[#fff]",
        borderRadius: "[2em]",
        padding: "0 0.3em",
        fontSize: "0.9em",
        marginLeft: "0.5em",
      })}
    >
      {children}
    </span>
  );
};
