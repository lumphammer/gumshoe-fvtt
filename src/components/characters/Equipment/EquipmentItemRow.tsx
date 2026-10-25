import type { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import React, { useCallback, useContext, useState } from "react";

import { assertApplicationV2 } from "../../../functions/assertApplicationV2";
import type { EquipmentItem } from "../../../module/items/equipment";
import { ThemeContext } from "../../../themes/ThemeContext";
import { DeleteItemButton } from "../../inputs/DeleteItemButton";
import { ItemNameWithIcon } from "../ItemNameWithIcon";
import { CheckOrCross } from "./CheckOrCross";

interface EquipmentItemRowProps {
  item: EquipmentItem;
  onDragStart: (e: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  gridRow: number;
  fields: Record<string, EquipmentFieldMetadata>;
}

export const EquipmentItemRow = ({
  item,
  onDragStart,
  onDragEnd,
  gridRow,
  fields,
}: EquipmentItemRowProps) => {
  const theme = useContext(ThemeContext);
  const [hover, setHover] = useState(false);
  const handleMouseOver = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setHover(true);
  }, []);
  const handleMouseOut = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setHover(false);
  }, []);

  const sheet = item.sheet;
  assertApplicationV2(sheet);

  return (
    <>
      {/* hover bar */}
      <div
        css={{
          gridColumn: "1/-1",
          gridRow,
          backgroundColor: hover ? theme.colors.backgroundButton : undefined,
          // padding: "0.5em",
          // ":hover": {
          // },
        }}
      />
      <a
        key={item.id}
        css={{
          gridColumn: "1",
          gridRow,
          // mouseEvents: "none",
          // pointerEvents: "",
          cursor: "pointer",
        }}
        onClick={() => sheet.render({ force: true })}
        data-item-id={item.id}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        draggable="true"
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        <ItemNameWithIcon item={item} />
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
            onClick={() => sheet.render({ force: true })}
          >
            {field.type === "checkbox" ? (
              <CheckOrCross checked={!!item.system.fields?.[fieldId]} />
            ) : (
              <span>{item.system.fields?.[fieldId]}</span>
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
};

EquipmentItemRow.displayName = "EquipmentItemRow";
