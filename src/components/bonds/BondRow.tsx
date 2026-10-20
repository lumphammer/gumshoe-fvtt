import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import type React from "react";
import { useCallback, useContext } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import type { BondItem } from "../../module/items/bond";
import { ThemeContext } from "../../themes/ThemeContext";
import { BondBadges } from "./BondBadges";

/**
 * One Bond on the Bonds tab: name, badges and rating. The whole row opens
 * the Bond's sheet (where it can be edited and burned), and drags the Bond.
 */
export const BondRow = ({ bond }: { bond: BondItem }) => {
  const app = useContext(FoundryAppContext);
  const theme = useContext(ThemeContext);
  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLAnchorElement>) => {
      if (app !== null) {
        (app as any)._onDragStart(e);
      }
    },
    [app],
  );
  const sheet = bond.sheet;
  assertApplicationV2(sheet);

  return (
    <a
      // a subgrid, so the cells line up with the headers, and the row can
      // still be one thing to hover, click and drag
      css={{
        gridColumn: "1/-1",
        display: "grid",
        gridTemplateColumns: "subgrid",
        alignItems: "center",
        padding: "0.2em 0",
        cursor: "pointer",
        // the highlight is enough; no link underline
        "&&:hover": {
          backgroundColor: theme.colors.backgroundButton,
          textDecoration: "none",
        },
        "& > *": { paddingInline: "0.25em" },
      }}
      onClick={() => sheet.render({ force: true })}
      data-item-id={bond.id}
      onDragStart={onDragStart}
      draggable="true"
    >
      <div
        data-testid="bond-name"
        title={bond.name ?? ""}
        css={{
          // up to half the table (cqw: the table is the container), then
          // cut off
          maxWidth: "50cqw",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {bond.name}
      </div>
      <div
        css={{
          display: "flex",
          // its min-content width, so the column always fits both badges
          flexWrap: "nowrap",
          alignItems: "center",
          gap: "0.5em",
        }}
      >
        <BondBadges bond={bond} />
      </div>
      {/* right-aligned, so the numbers line up under the header */}
      <div data-testid="bond-rating" css={{ textAlign: "end" }}>
        {bond.system.points}
      </div>
    </a>
  );
};

BondRow.displayName = "BondRow";
