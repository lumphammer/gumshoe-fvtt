import type { ReactNode } from "react";
import React, { Fragment, useContext, useMemo } from "react";

import { MagicToolbarContentContext } from "./contexts";
import { css } from "../../../styled-system/css";

interface MagicToolbarProps extends React.PropsWithChildren {
  categories: string[];
  childrenCategory: string;
}

function normalizeCategory(category: string) {
  return category.toLowerCase().replace(/\W+/g, "-");
}

/**
 * Render the actual toolbar. Children content will be rendered first. If you
 * want to provide more content woth sorting options, use a samll wrapper
 * component which calls useToolbarContent.
 */
export const MagicToolbar = ({
  children,
  categories,
  childrenCategory,
}: MagicToolbarProps) => {
  // get all the content that's been registered, and group them by category
  const registeredContent = Object.values(
    useContext(MagicToolbarContentContext),
  );
  const groupedContent: Record<string, ReactNode[]> = {
    [childrenCategory]: [children],
  };
  for (const entry of registeredContent) {
    if (entry.content === null) {
      continue;
    }

    if (groupedContent[entry.category] === undefined) {
      groupedContent[entry.category] = [];
    }
    groupedContent[entry.category].push(
      <Fragment key={groupedContent[entry.category].length}>
        {entry.content}
      </Fragment>,
    );
  }

  const normalizedCategories = useMemo(() => {
    return categories.map(normalizeCategory);
  }, [categories]);

  // produce a list of all the actual categories, sorted to match the order of
  // the categories prop
  const sortedCategories = Object.keys(groupedContent).sort((a, b) => {
    return (
      normalizedCategories.indexOf(normalizeCategory(a)) -
      normalizedCategories.indexOf(normalizeCategory(b))
    );
  });

  const content = sortedCategories.map((category, index) => {
    return (
      <Fragment key={category}>
        <div
          className={css({ gridRow: 1, borderBottom: "1px solid" })}
          style={{ gridColumn: index + 1 }}
        >
          {category}
        </div>
        <div
          className={css({
            gridRow: 2,
            display: "flex",
            flexDirection: "row",
            gap: "0.5em",
          })}
          style={{ gridColumn: index + 1 }}
        >
          {groupedContent[category]}
        </div>
      </Fragment>
    );
  });
  return (
    <div
      className={css({
        display: "grid",
        gridTemplateRows: "auto 1fr",
        justifyContent: "start",
        columnGap: "1em",
        rowGap: "0.5em",
      })}
    >
      {content}
    </div>
  );
};

MagicToolbar.displayName = "MagicToolbar";
