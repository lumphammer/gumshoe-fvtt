import { memo, useState } from "react";

import * as c from "../../../constants";
import { getTranslated } from "../../../functions/getTranslated";
import { sortEntitiesByName } from "../../../functions/utilities";
import { useActorSnapshot } from "../../../hooks/useActorSnapshot";
import { useSettings } from "../../../hooks/useSettings";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { assertPCActor } from "../../../module/actors/pc";
import type { EquipmentItem } from "../../../module/items/equipment";
import { EquipmentCategory } from "./EquipmentCategory";

// kept stable, so the categories can stay memoised
const noIds: string[] = [];
const noFields = {};

/**
 * The character's equipment, by category. Reads the actor through a snapshot,
 * selecting only which items go in which category: each row reads its own
 * item.
 */
export const EquipmentArea = memo(function EquipmentArea() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const categories = useSettings((s) => s.equipmentCategories);
  // item ids by category id, sorted by name ("" for those in no category)
  const idsByCategory = useActorSnapshot(actor, (snapshot) => {
    const result: Record<string, string[]> = {};
    const equipment = sortEntitiesByName(
      snapshot.items.filter((item) => item.type === c.equipment),
    );
    for (const item of equipment) {
      const categoryId = item.system.categoryId;
      const key = categoryId in categories ? categoryId : "";
      const ids = result[key] ?? [];
      ids.push(item._id ?? "");
      result[key] = ids;
    }
    return result;
  });
  // the item being dragged, if it's one of these, so the other categories
  // can take it
  const [draggedItem, setDraggedItem] = useState<EquipmentItem | null>(null);
  const uncategorizedIds = idsByCategory[""] ?? noIds;

  return (
    <div>
      {Object.entries(categories).map(([categoryId, category]) => {
        return (
          <EquipmentCategory
            actor={actor}
            categoryId={categoryId}
            ids={idsByCategory[categoryId] ?? noIds}
            name={category.name}
            key={categoryId}
            fields={category.fields}
            draggedItem={draggedItem}
            setDraggedItem={setDraggedItem}
          />
        );
      })}
      {uncategorizedIds.length > 0 && (
        <EquipmentCategory
          actor={actor}
          categoryId={""}
          ids={uncategorizedIds}
          name={getTranslated("Uncategorized")}
          fields={noFields}
          draggedItem={draggedItem}
          setDraggedItem={setDraggedItem}
        />
      )}
    </div>
  );
});
