import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import type React from "react";
import { memo, useCallback, useContext } from "react";

import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { useItemSelector } from "../../hooks/useItemSnapshot";
import type { NetworkContactItem } from "../../module/items/networkContact";
import { ThemeContext } from "../../themes/ThemeContext";
import { ItemNameWithIcon } from "../characters/ItemNameWithIcon";
import { DeleteItemButton } from "../inputs/DeleteItemButton";

/**
 * One contact on the Contacts tab: name, location and pool, and a delete
 * button. The rest of the row opens the contact's sheet (where they're used),
 * and drags the contact.
 */
export const NetworkContactRow = memo(function NetworkContactRow({
  contact,
}: {
  /** The live contact: the row reads it through a snapshot */
  contact: NetworkContactItem;
}) {
  const row = useItemSelector(contact, (snapshot) => ({
    name: snapshot.name,
    img: snapshot.img,
    location: (snapshot.system as { location: string }).location,
    pool: (snapshot.system as { pool: number }).pool,
  }));
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
    const sheet = contact.sheet;
    assertApplicationV2(sheet);
    void sheet.render({ force: true });
  };
  const exhausted = row.pool === 0;

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
          opacity: exhausted ? 0.6 : 1,
          "&&:hover": { textDecoration: "none" },
          "& > *": {
            paddingInline: "0.25em",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          },
        }}
        onClick={openSheet}
        data-item-id={contact.id}
        data-testid="network-contact-row"
        onDragStart={onDragStart}
        draggable="true"
      >
        <ItemNameWithIcon item={row} title={row.name} />
        <div title={row.location}>{row.location}</div>
        <div data-testid="network-contact-pool" css={{ textAlign: "end" }}>
          {row.pool}
        </div>
      </a>
      <DeleteItemButton item={contact} />
    </div>
  );
});

NetworkContactRow.displayName = "NetworkContactRow";
