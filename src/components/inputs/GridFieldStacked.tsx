import { nanoid } from "nanoid";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { IdContext } from "../IdContext";
import { Translate } from "../Translate";
import { css, cx } from "../../styled-system/css";
import { fieldGrid } from "../../styled-system/recipes";

type GridFieldStackedProps = {
  label?: string | ReactNode;
  className?: string;
  children?: any;
  noTranslate?: boolean;
};

export const GridFieldStacked = ({
  label,
  className,
  children,
  noTranslate = false,
}: GridFieldStackedProps) => {
  const htmlId = useMemo(() => nanoid(), []);
  const classes = fieldGrid({ stacked: true });
  return (
    <IdContext.Provider value={htmlId}>
      <div
        className={css({
          gridColumn: "label / end",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        })}
      >
        <label htmlFor={htmlId} className={classes.label}>
          {label &&
            (noTranslate || typeof label !== "string" ? (
              label
            ) : (
              <Translate>{label}</Translate>
            ))}
        </label>
        <div
          className={cx(
            classes.control,
            css({
              position: "relative",
              flex: "[1]",
            }),
            className,
          )}
        >
          {children}
        </div>
      </div>
    </IdContext.Provider>
  );
};
