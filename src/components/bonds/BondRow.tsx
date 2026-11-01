import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import type React from "react";
import { memo, useCallback, useContext } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { isBondBroken } from "../../module/bonds/rules";
import type { BondItem } from "../../module/items/bond";
import { ThemeContext } from "../../themes/ThemeContext";
import { ItemNameWithIcon } from "../characters/ItemNameWithIcon";
import { DeleteItemButton } from "../inputs/DeleteItemButton";
import { BondBadges } from "./BondBadges";

/**
 * One Bond on the Bonds tab: name, badges and rating, and a delete button.
 * The rest of the row opens the Bond's sheet (where it can be edited and
 * burned), and drags the Bond.
 */
export const BondRow = memo(function BondRow({
  bond,
}: {
  /** The live Bond: the row reads it through a snapshot */
  bond: BondItem;
}) {
  "use memo";

  const row = useItemSelector(bond, (snapshot) => {
    const system = snapshot.system as { points: number; isDeltaGreen: boolean };
    return {
      name: snapshot.name,
      img: snapshot.img,
      points: system.points,
      isDeltaGreen: system.isDeltaGreen,
      isBroken: isBondBroken(system.points),
    };
  });
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
  const openSheet = () => {
    const sheet = bond.sheet;
    assertApplicationV2(sheet);
    void sheet.render({ force: true });
  };

  return (
    // a subgrid, so the cells line up with the headers, and the row can be
    // one thing to hover
    <div
      css={{
        gridColumn: "1/-1",
        display: "grid",
        gridTemplateColumns: "subgrid",
        alignItems: "center",
        "&:hover": { backgroundColor: theme.colors.backgroundButton },
      }}
    >
      {/* everything but the delete button, to click and drag */}
      <a
        css={{
          gridColumn: "1/-2",
          display: "grid",
          gridTemplateColumns: "subgrid",
          alignItems: "center",
          padding: "0.2em 0",
          cursor: "pointer",
          // the highlight is enough; no link underline
          "&&:hover": { textDecoration: "none" },
          "& > *": { paddingInline: "0.25em" },
        }}
        onClick={openSheet}
        data-item-id={bond.id}
        onDragStart={onDragStart}
        draggable="true"
      >
        <ItemNameWithIcon
          item={row}
          data-testid="bond-name"
          title={row.name}
          // up to half the table (cqw: the table is the container), then cut
          // off
          css={{ maxWidth: "50cqw" }}
        />
        <div
          css={{
            display: "flex",
            // its min-content width, so the column always fits both badges
            flexWrap: "nowrap",
            alignItems: "center",
            gap: "0.5em",
          }}
        >
          <BondBadges isDeltaGreen={row.isDeltaGreen} isBroken={row.isBroken} />
        </div>
        {/* right-aligned, so the numbers line up under the header */}
        <div data-testid="bond-rating" css={{ textAlign: "end" }}>
          {row.points}
        </div>
      </a>
      <DeleteItemButton item={bond} />
    </div>
  );
});

BondRow.displayName = "BondRow";
