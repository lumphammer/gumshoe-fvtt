import React, { memo, useCallback, useState } from "react";

import { openSheet } from "../../../functions/openSheet";
import { useItemSelector } from "../../../hooks/useItemSnapshot";
import type {
  EquipmentCategoriesSnapshot,
  EquipmentItem,
} from "../../../module/items/equipment";
import { DeleteItemButton } from "../../inputs/DeleteItemButton";
import { ItemNameWithIcon } from "../ItemNameWithIcon";
import { CheckOrCross } from "./CheckOrCross";
import { row as rowClass } from "../../../styled-system/recipes";

interface EquipmentItemRowProps {
  /** The live item: the row reads it through a snapshot */
  item: EquipmentItem;
  onDragStart: (e: React.DragEvent<HTMLElement>, item: EquipmentItem) => void;
  onDragEnd: () => void;
  gridRow: number;
  fields: EquipmentCategoriesSnapshot[string]["fields"];
}

export const EquipmentItemRow = memo(function EquipmentItemRow({
  item,
  onDragStart,
  onDragEnd,
  gridRow,
  fields,
}: EquipmentItemRowProps) {
  const row = useItemSelector(item, (snapshot) => ({
    name: snapshot.name,
    img: snapshot.img,
    fields: snapshot.system.fields,
  }));
  const [hover, setHover] = useState(false);
  const handleMouseOver = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setHover(true);
  }, []);
  const handleMouseOut = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setHover(false);
  }, []);

  const openItemSheet = () => {
    openSheet(item);
  };

  return (
    <>
      {/* hover bar */}
      <div
        className={rowClass({ interactive: true })}
        data-highlighted={hover || undefined}
        css={{ gridColumn: "1/-1", gridRow }}
      />
      <a
        key={item.id}
        css={{
          gridColumn: "1",
          gridRow,
          // mouseEvents: "none",
          // pointerEvents: "",
          cursor: "pointer",
          // so a long name is cut off, rather than widening the table
          minWidth: 0,
        }}
        onClick={openItemSheet}
        data-item-id={item.id}
        onDragStart={(e) => onDragStart(e, item)}
        onDragEnd={onDragEnd}
        draggable="true"
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        <ItemNameWithIcon item={row} />
      </a>
      {Object.entries(fields).map(([fieldId, field], j) => {
        return (
          <a
            key={fieldId}
            css={{
              gridColumn: j + 2,
              gridRow,
              mouseEvents: "none",
            }}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            onClick={openItemSheet}
          >
            {field.type === "checkbox" ? (
              <CheckOrCross checked={!!row.fields?.[fieldId]} />
            ) : (
              <span>{row.fields?.[fieldId]}</span>
            )}
          </a>
        );
      })}
      <DeleteItemButton
        item={item}
        css={{
          gridColumn: Object.keys(fields).length + 2,
          gridRow,
        }}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      />
    </>
  );
});

EquipmentItemRow.displayName = "EquipmentItemRow";
