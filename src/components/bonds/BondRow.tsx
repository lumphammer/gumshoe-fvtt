import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import type React from "react";
import { useCallback, useContext } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { brokenBondPoints, maxBondPoints } from "../../module/bonds/rules";
import type { BondItem } from "../../module/items/bond";
import { ThemeContext } from "../../themes/ThemeContext";
import { AsyncNumberInput } from "../inputs/AsyncNumberInput";
import { BondBadges } from "./BondBadges";

/**
 * One Bond on the Bonds tab: name (click to open, drag to move), badges, and
 * a points stepper.
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
    // `display: contents` keeps the cells in the parent grid
    <div css={{ display: "contents" }}>
      <div
        css={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.5em",
          minWidth: 0,
        }}
      >
        <a
          css={{
            cursor: "pointer",
            ":hover": { color: theme.colors.accent },
          }}
          onClick={() => sheet.render({ force: true })}
          data-item-id={bond.id}
          onDragStart={onDragStart}
          draggable="true"
        >
          {bond.name}
        </a>
        <BondBadges bond={bond} />
      </div>
      <AsyncNumberInput
        css={{ width: "7em" }}
        value={bond.system.points}
        onChange={bond.system.setPoints}
        min={brokenBondPoints}
        max={maxBondPoints}
      />
    </div>
  );
};

BondRow.displayName = "BondRow";
