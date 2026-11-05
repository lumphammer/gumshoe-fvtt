import * as stylex from "@stylexjs/stylex";
import { memo } from "react";

import { useDragStart } from "../../hooks/useDragStart";
import { openSheet } from "../../functions/openSheet";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import { isBondBroken } from "../../module/bonds/rules";
import type { BondItem } from "../../module/items/bond";
import { colors } from "../../themes/spike/tokens.stylex";
import { ItemNameWithIcon } from "../characters/ItemNameWithIcon";
import { DeleteItemButton } from "../inputs/DeleteItemButton";
import { BondBadges } from "./BondBadges";

/**
 * One Bond on the Bonds tab: name, badges and rating, and a delete button.
 * The rest of the row opens the Bond's sheet (where it can be edited and
 * burned), and drags the Bond.
 */
const styles = stylex.create({
  row: {
    gridColumn: "1/-1",
    display: "grid",
    gridTemplateColumns: "subgrid",
    alignItems: "center",
    backgroundColor: { default: null, ":hover": colors.bgButton },
  },
  link: {
    gridColumn: "1/-2",
    display: "grid",
    gridTemplateColumns: "subgrid",
    alignItems: "center",
    padding: "0.2em 0",
    cursor: "pointer",
    // the highlight is enough; no link underline
    textDecoration: { default: null, ":hover": "none" },
  },
  // was `"& > *"` on the link: StyleX styles only the element they're on
  cell: { paddingInline: "0.25em" },
  end: { textAlign: "end" },
});

export const BondRow = memo(function BondRow({
  bond,
}: {
  /** The live Bond: the row reads it through a snapshot */
  bond: BondItem;
}) {
  const row = useItemSelector(bond, ({ name, img, system }) => ({
    name,
    img,
    points: system.points,
    isDeltaGreen: system.isDeltaGreen,
    isBroken: isBondBroken(system.points),
  }));
  const onDragStart = useDragStart();
  const openBondSheet = () => {
    openSheet(bond);
  };

  return (
    // a subgrid, so the cells line up with the headers, and the row can be
    // one thing to hover
    <div {...stylex.props(styles.row)}>
      {/* everything but the delete button, to click and drag */}
      <a
        {...stylex.props(styles.link)}
        onClick={openBondSheet}
        data-item-id={bond.id}
        onDragStart={onDragStart}
        draggable="true"
      >
        <ItemNameWithIcon
          item={row}
          data-testid="bond-name"
          className={stylex.props(styles.cell).className}
          title={row.name}
          // up to half the table (cqw: the table is the container), then cut
          // off
          css={{ maxWidth: "50cqw" }}
        />
        <div
          {...stylex.props(styles.cell)}
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
        <div
          data-testid="bond-rating"
          {...stylex.props(styles.cell, styles.end)}
        >
          {row.points}
        </div>
      </a>
      <DeleteItemButton item={bond} />
    </div>
  );
});

BondRow.displayName = "BondRow";
