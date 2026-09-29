import type { CSSObject } from "@lumphammer/investigator-fvtt-types";
import { nanoid } from "nanoid";
import type { DragEventHandler } from "react";
import { useMemo } from "react";

import { IdContext } from "../IdContext";
import { Translate } from "../Translate";

type GridFieldProps = {
  label?: string;
  className?: string;
  children?: any;
  noLabel?: boolean;
  noTranslate?: boolean;
  labelTitle?: string;
  onDragOver?: DragEventHandler<HTMLElement>;
  onDragEnd?: DragEventHandler<HTMLElement>;
  onDrop?: DragEventHandler<HTMLElement>;
  labelStyle?: CSSObject;
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
  labelStyle,
}: GridFieldProps) => {
  const id = useMemo(() => nanoid(), []);
  return (
    <IdContext.Provider value={id}>
      <label
        title={labelTitle}
        htmlFor={noLabel ? undefined : id}
        css={{
          gridColumn: "label",
          paddingTop: "0.3em",
          paddingRight: "0.5em",
          alignSelf: "start",
          textAlign: "end",
          overflowWrap: "anywhere",
          ...labelStyle,
        }}
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
            <Translate title={labelTitle}>{label}</Translate>
          ))}
      </label>
      <div
        className={className}
        css={{
          gridColumn: "control",
          alignSelf: "center",
        }}
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
