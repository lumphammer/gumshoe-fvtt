import { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import React, { useCallback, useContext, useState } from "react";

import { EquipmentItem } from "../../../module/items/equipment";
import { ThemeContext } from "../../../themes/ThemeContext";
import { CheckOrCross } from "./CheckOrCross";

interface EquipmentItemRowProps {
  item: EquipmentItem;
  onDragStart: (e: React.DragEvent<HTMLElement>) => void;
  gridRow: number;
  fields: Record<string, EquipmentFieldMetadata>;
}

export const EquipmentItemRow = ({
  item,
  onDragStart,
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
        onClick={() => item.sheet?.render(true)}
        data-item-id={item.id}
        onDragStart={onDragStart}
        draggable="true"
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        {item.name}
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
            onClick={() => item.sheet?.render(true)}
          >
            {field.type === "checkbox" ? (
              <CheckOrCross checked={!!item.system.fields?.[fieldId]} />
            ) : (
              <span>{item.system.fields?.[fieldId]}</span>
            )}
          </a>
        );
      })}
    </>
  );
};

EquipmentItemRow.displayName = "EquipmentItemRow";
