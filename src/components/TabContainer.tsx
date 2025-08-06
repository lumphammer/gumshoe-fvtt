import { nanoid } from "nanoid";
import {
  ChangeEvent,
  Fragment,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";

import { ThemeContext } from "../themes/ThemeContext";
import { Translate } from "./Translate";
// import React, { useMemo, useState } from "react";

type TabDefinition = {
  id: string;
  label: ReactNode;
  content: ReactNode;
  translate?: boolean;
};

type TabContainerProps = {
  tabs: (TabDefinition | null | false | undefined)[];
  defaultTab: string;
};

export const TabContainer = ({
  tabs: rawTabsDefs,
  defaultTab,
}: TabContainerProps) => {
  const [selected, setSelected] = useState(defaultTab);
  const [optimistic, setOptimistic] = useState(defaultTab);
  const [pending, startTransition] = useTransition();
  const tabDefs = useMemo(() => rawTabsDefs.filter((t) => !!t), [rawTabsDefs]);
  const activeTabDef = useMemo(
    () => tabDefs.find((t) => t.id === selected),
    [selected, tabDefs],
  );
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setOptimistic(e.currentTarget.value);
    startTransition(() => {
      setSelected(e.currentTarget.value);
    });
  }, []);

  const theme = useContext(ThemeContext);

  // would love to do this point-free, but react compiler wants to see a
  // function literal
  const radioGroup = useMemo(() => nanoid(), []);

  return (
    <div
      className="tab-container-outer"
      key={selected}
      css={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        ".tab-strip": {
          display: "flex",
          flexDirection: "row",
        },
        "input[type=radio]": {
          display: "none",
          "+label": theme.tabStyle,
          "&:checked+label": theme.tabActiveStyle,
          "&[disabled]+label": {
            opacity: 0.3,
            ":hover": {
              textShadow: "none",
            },
          },
        },
      }}
    >
      <div className="tab-strip">
        {tabDefs.map(({ id, label, translate = true }, index) => {
          const htmlId = nanoid();
          return (
            <Fragment key={id}>
              <input
                name={radioGroup}
                id={htmlId}
                type="radio"
                value={id}
                checked={id === selected}
                onChange={onChange}
              />
              <label
                htmlFor={htmlId}
                tabIndex={0}
                className={theme.tabClass}
                css={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  opacity: pending && id === optimistic ? 0.5 : 1,
                  font: theme.displayFont,
                }}
              >
                {typeof label === "string" ? (
                  translate ? (
                    <Translate>{label}</Translate>
                  ) : (
                    label
                  )
                ) : (
                  label
                )}
              </label>
              {index < tabDefs.length - 1 && <div css={theme.tabSpacerStyle} />}
            </Fragment>
          );
        })}
      </div>
      <div
        className={`tab-content ${theme.panelClass ?? ""}`}
        css={{
          flex: 1,
          position: "relative",
          overflow: "auto",
          padding: "0.5em",
          ...theme.tabContentStyle,
        }}
      >
        {activeTabDef?.content}
      </div>
    </div>
  );
};
