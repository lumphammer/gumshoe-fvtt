import { nanoid } from "nanoid";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { IdContext } from "../IdContext";
import { Translate } from "../Translate";

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
  return (
    <IdContext.Provider value={htmlId}>
      <div
        css={{
          gridColumn: "label / end",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <label htmlFor={htmlId} css={{}}>
          {label &&
            (noTranslate || typeof label !== "string" ? (
              label
            ) : (
              <Translate>{label}</Translate>
            ))}
        </label>
        <div
          css={{
            position: "relative",
            flex: 1,
          }}
          className={className}
        >
          {children}
        </div>
      </div>
    </IdContext.Provider>
  );
};
