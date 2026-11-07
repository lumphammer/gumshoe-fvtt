import { nanoid } from "nanoid";
import type { DragEventHandler, ReactNode } from "react";
import { useMemo } from "react";

import { IdContext } from "../IdContext";
import { Translate } from "../Translate";
import { css, cx } from "../../styled-system/css";

type GridFieldProps = {
  label?: ReactNode;
  className?: string;
  children?: any;
  noLabel?: boolean;
  noTranslate?: boolean;
  labelTitle?: string;
  onDragOver?: DragEventHandler<HTMLElement>;
  onDragEnd?: DragEventHandler<HTMLElement>;
  onDrop?: DragEventHandler<HTMLElement>;
  /** For the label: the call site's changes to its layout */
  labelClassName?: string;
};

export const GridField = ({
  label,
  className,
  children,
  noLabel = false,
  noTranslate = false,
  labelTitle,
  onDragOver,
  onDragEnd,
  onDrop,
  labelClassName,
}: GridFieldProps) => {
  const id = useMemo(() => nanoid(), []);
  return (
    <IdContext.Provider value={id}>
      <label
        title={labelTitle}
        htmlFor={noLabel ? undefined : id}
        // layout, which call sites can change (componentDefaults.css)
        className={cx("inv-default-grid-field-label", labelClassName)}
        // drag handlers
        onDragOver={onDragOver}
        onDragLeave={onDragEnd}
        onDragEnd={onDragEnd}
        onDrop={onDrop}
      >
        {label &&
          (noTranslate || typeof label !== "string" ? (
            label
          ) : (
            <Translate>{label}</Translate>
          ))}
      </label>
      <div
        className={cx(
          className,
          css({
            gridColumn: "control",
            alignSelf: "center",
          }),
        )}
        // drag handlers
        onDragOver={onDragOver}
        onDragLeave={onDragEnd}
        onDragEnd={onDragEnd}
        onDrop={onDrop}
      >
        {children}
      </div>
    </IdContext.Provider>
  );
};
