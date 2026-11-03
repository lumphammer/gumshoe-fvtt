import type React from "react";
import { memo, useCallback, useContext, useState } from "react";

import { liveItems } from "../../../functions/liveItems";
import { isEquipmentItem } from "../../../module/items/equipment";
import { useDragStart } from "../../../hooks/useDragStart";
import { useSystemMethods } from "../../../hooks/useSystemMethods";
import type { PCActor } from "../../../module/actors/pc";
import type {
  EquipmentCategoriesSnapshot,
  EquipmentItem,
} from "../../../module/items/equipment";
import { ThemeContext } from "../../../themes/ThemeContext";
import { Button } from "../../inputs/Button";
import { Translate } from "../../Translate";
import { EquipmentItemRow } from "./EquipmentItemRow";

interface EquipmentCategoryProps {
  categoryId: string;
  /** The items' ids, in order: each row reads its own item */
  ids: readonly string[];
  name: string;
  actor: PCActor;
  fields: EquipmentCategoriesSnapshot[string]["fields"];
  draggedItem: EquipmentItem | null;
  setDraggedItem: (item: EquipmentItem | null) => void;
}

export const EquipmentCategory = memo(function EquipmentCategory({
  categoryId,
  ids,
  name,
  actor,
  fields,
  draggedItem,
  setDraggedItem,
}: EquipmentCategoryProps) {
  const dragStart = useDragStart();
  const theme = useContext(ThemeContext);
  const { createEquipment } = useSystemMethods(actor);
  // the live items, only to pass to the rows
  const items = liveItems(actor, ids, isEquipmentItem);

  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLElement>, item: EquipmentItem) => {
      // Foundry's drag data, so it can still be dropped on other sheets etc.
      dragStart(e);
      setDraggedItem(item);
    },
    [dragStart, setDraggedItem],
  );
  const onDragEnd = useCallback(() => setDraggedItem(null), [setDraggedItem]);

  // another category's item can be dropped here (but not on Uncategorized)
  const canDrop =
    draggedItem !== null &&
    categoryId !== "" &&
    draggedItem.system.categoryId !== categoryId;
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        if (!canDrop) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsOver(true);
      }}
      onDragLeave={(e) => {
        // only when leaving the category, not moving between its children
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsOver(false);
        }
      }}
      onDrop={(e) => {
        setIsOver(false);
        if (!canDrop) return;
        // ours, not the sheet's (which would sort the item, or copy it)
        e.preventDefault();
        e.stopPropagation();
        setDraggedItem(null);
        void draggedItem.system.setCategoryId(categoryId);
      }}
      css={{
        borderRadius: "0.3em",
        outline: canDrop
          ? `2px dashed ${isOver ? theme.colors.accent : theme.colors.controlBorder}`
          : "2px dashed transparent",
        outlineOffset: "0.2em",
        background: isOver
          ? `color-mix(in srgb, ${theme.colors.glow} 25%, transparent)`
          : undefined,
        display: "grid",
        // the name, the fields, then each row's delete button (`repeat()`
        // can't take 0, so no fields means none of it)
        gridTemplateColumns: [
          "1fr",
          ...Object.keys(fields).map(() => "1fr"),
          "max-content",
        ].join(" "),
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
              await createEquipment(categoryId);
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
      {items.map((item, i) => (
        <EquipmentItemRow
          item={item}
          key={item.id}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
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
});

EquipmentCategory.displayName = "EquipmentCategory";
