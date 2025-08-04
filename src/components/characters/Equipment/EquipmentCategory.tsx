import { EquipmentFieldMetadata } from "@lumphammer/investigator-fvtt-types";
import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, { useCallback, useContext } from "react";

import { sortEntitiesByName } from "../../../functions/utilities";
import { PCActor } from "../../../module/actors/pc";
import { EquipmentItem } from "../../../module/items/equipment";
import { ThemeContext } from "../../../themes/ThemeContext";
import { Button } from "../../inputs/Button";
import { Translate } from "../../Translate";
import { EquipmentItemRow } from "./EquipmentItemRow";

interface EquipmentCategoryProps {
  categoryId: string;
  items: EquipmentItem[];
  name: string;
  actor: PCActor;
  fields: Record<string, EquipmentFieldMetadata>;
}

export const EquipmentCategory = ({
  categoryId,
  items,
  name,
  actor,
  fields,
}: EquipmentCategoryProps) => {
  const app = useContext(FoundryAppContext);

  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      if (app !== null) {
        (app as any)._onDragStart(e);
      }
    },
    [app],
  );

  const theme = useContext(ThemeContext);

  return (
    <div
      css={{
        display: "grid",
        gridTemplateColumns: `1fr repeat(${Object.keys(fields).length}, 1fr)`,
        gridTemplateRows: "[title] auto [headers] auto [items] auto",
        // gap: "0.5em",
      }}
    >
      {/* Top row */}
      <div
        css={{
          gridColumn: "1/-1",
          gridRow: "title",
          display: "flex",
          flexDirection: "row",
          margin: "0 0 0 0",
        }}
      >
        <h2
          css={{
            flex: 1,
          }}
        >
          {name}
        </h2>
        {categoryId !== undefined && categoryId !== "" && (
          <Button
            css={{
              flexBasis: "max-content",
            }}
            onClick={async () => {
              await actor.system.createEquipment(categoryId);
            }}
          >
            <i className="fa fa-plus" />
            <Translate>Add Equipment</Translate>
          </Button>
        )}
      </div>

      {/* Headers */}
      <div
        css={{
          gridColumn: "1/-1",
          gridRow: "headers",
          borderBottom: `1px solid ${theme.colors.controlBorder}`,
        }}
      />
      <div css={{ gridColumn: "1", gridRow: "headers" }}>
        <Translate>Item Name</Translate>
      </div>
      {Object.entries(fields).map(([fieldId, field], i) => {
        return (
          <div key={fieldId} css={{ gridColumn: i + 2, gridRow: "headers" }}>
            {field.name}
          </div>
        );
      })}

      {/* Nothing */}
      {items.length === 0 && (
        <i
          css={{
            gridColumn: "1 / -1",
            gridRow: "items",
            fontSize: "1.2em",
          }}
        >
          <Translate>No equipment yet.</Translate>
        </i>
      )}

      {/* Items */}
      {sortEntitiesByName(items).map((item, i) => (
        <EquipmentItemRow
          item={item}
          key={item.id}
          onDragStart={onDragStart}
          gridRow={i + 4}
          fields={fields}
        />
      ))}

      {/* Spacing */}
      <div
        css={{
          gridColumn: "1 / -1",
          gridRow: items.length + 4,
          height: "2em",
        }}
      />
    </div>
  );
};

EquipmentCategory.displayName = "EquipmentCategory";
