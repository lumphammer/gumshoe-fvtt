import type { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import React, { useCallback, useContext, useState } from "react";

import { assertApplicationV2 } from "../../../functions/assertApplicationV2";
import { confirmADoodleDo } from "../../../functions/confirmADoodleDo";
import { getTranslated } from "../../../functions/getTranslated";
import type { EquipmentItem } from "../../../module/items/equipment";
import { ThemeContext } from "../../../themes/ThemeContext";
import { Button } from "../../inputs/Button";
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

  const onClickDelete = async () => {
    const yes = await confirmADoodleDo({
      message: "DeleteActorNamesEquipmentName",
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmIconClass: "fa-trash",
      resolveFalseOnCancel: true,
      values: {
        ActorName: item.actor?.name ?? "",
        EquipmentName: item.name ?? "",
      },
    });
    if (yes) {
      await item.delete();
    }
  };

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
      <Button
        css={{
          gridColumn: Object.keys(fields).length + 2,
          gridRow,
          alignSelf: "center",
          "&&": { width: "auto" },
          padding: "0 0.3em",
          margin: "0.1em 0",
          lineHeight: 1.4,
        }}
        aria-label={getTranslated("Delete")}
        title={getTranslated("Delete")}
        onClick={onClickDelete}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        <i className="fa fa-trash" />
      </Button>
    </>
  );
};

EquipmentItemRow.displayName = "EquipmentItemRow";
