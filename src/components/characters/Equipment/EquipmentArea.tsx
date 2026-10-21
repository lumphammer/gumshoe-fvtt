import { useState } from "react";

import { getTranslated } from "../../../functions/getTranslated";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { assertPCActor } from "../../../module/actors/pc";
import type { EquipmentItem } from "../../../module/items/equipment";
import { isEquipmentItem } from "../../../module/items/equipment";
import { settings } from "../../../settings/settings";
import { EquipmentCategory } from "./EquipmentCategory";

export const EquipmentArea = () => {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const items = actor.system.getEquipment();
  const categories = settings.equipmentCategories.get();
  // the item being dragged, if it's one of these, so the other categories
  // can take it
  const [draggedItem, setDraggedItem] = useState<EquipmentItem | null>(null);

  const uncategorizedItems = items.filter(
    (item) =>
      isEquipmentItem(item) &&
      Object.keys(categories).indexOf(item.system.categoryId) === -1,
  );

  return (
    <div>
      {Object.entries(categories).map(([categoryId, category]) => {
        return (
          <EquipmentCategory
            actor={actor}
            categoryId={categoryId}
            items={items.filter(
              (item) =>
                isEquipmentItem(item) && item.system.categoryId === categoryId,
            )}
            name={category.name}
            key={categoryId}
            fields={category.fields}
            draggedItem={draggedItem}
            setDraggedItem={setDraggedItem}
          />
        );
      })}
      {uncategorizedItems.length > 0 && (
        <EquipmentCategory
          actor={actor}
          categoryId={""}
          items={uncategorizedItems}
          name={getTranslated("Uncategorized")}
          fields={{}}
          draggedItem={draggedItem}
          setDraggedItem={setDraggedItem}
        />
      )}
    </div>
  );
};
