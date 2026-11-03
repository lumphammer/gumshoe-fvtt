import React, { memo } from "react";

import { useDragStart } from "../../../hooks/useDragStart";
import { mwItem } from "../../../constants";
import { sortEntitiesByName } from "../../../functions/utilities";
import { useActorSnapshot } from "../../../hooks/useActorSnapshot";
import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { assertPCActor } from "../../../module/actors/pc";
import type { MwType } from "../../../types";
import type { MwItemSummary } from "./MwItemGroup";
import { MwItemGroup } from "./MwItemGroup";

const groups: { name: string; mwType: MwType }[] = [
  { name: "Tweaks", mwType: "tweak" },
  { name: "Cantraps", mwType: "cantrap" },
  { name: "Spells", mwType: "spell" },
  { name: "EnchantedItems", mwType: "enchantedItem" },
  { name: "Melee Weapons", mwType: "meleeWeapon" },
  { name: "Missile Weapons", mwType: "missileWeapon" },
  { name: "Manses", mwType: "manse" },
  { name: "Sandestins", mwType: "sandestin" },
  { name: "Retainers", mwType: "retainer" },
];

const noItems: MwItemSummary[] = [];

/**
 * Moribund World's items, by type. Reads the actor through a snapshot,
 * selecting each item's id and name, by type, sorted by name (as
 * `getMwItems` groups them).
 */
export const MwItemArea = memo(function MwItemArea() {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);

  const onDragStart = useDragStart();

  const byType = useActorSnapshot(actor, (snapshot) => {
    const result: Partial<Record<MwType, MwItemSummary[]>> = {};
    const items = sortEntitiesByName(
      snapshot.items.filter((item) => item.type === mwItem),
    );
    for (const item of items) {
      const mwType = item.system.mwType;
      const group = result[mwType] ?? [];
      group.push({ id: item._id ?? "", name: item.name });
      result[mwType] = group;
    }
    return result;
  });

  return (
    <div>
      {groups.map(({ name, mwType }) => (
        <MwItemGroup
          key={mwType}
          name={name}
          mwType={mwType}
          items={byType[mwType] ?? noItems}
          onDragStart={onDragStart}
        />
      ))}
    </div>
  );
});
