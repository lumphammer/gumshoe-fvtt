import { FoundryAppContext } from "@lumphammer/shared-fvtt-bits/src/FoundryAppContext";
import React, { useCallback, useContext } from "react";

import { useActorSheetContext } from "../../../hooks/useSheetContexts";
import { assertPCActor } from "../../../module/actors/pc";
import { MwItemGroup } from "./MwItemGroup";

export const MwItemArea = () => {
  const { actor } = useActorSheetContext();
  assertPCActor(actor);
  const app = useContext(FoundryAppContext);

  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLAnchorElement>) => {
      if (app !== null) {
        (app as any)._onDragStart(e);
      }
    },
    [app],
  );

  const items = actor.system.getMwItems();
  return (
    <div>
      <MwItemGroup
        name="Tweaks"
        mwType="tweak"
        items={items.tweak}
        onDragStart={onDragStart}
      />
      <MwItemGroup
        name="Cantraps"
        mwType="cantrap"
        items={items.cantrap}
        onDragStart={onDragStart}
      />
      <MwItemGroup
        name="Spells"
        mwType="spell"
        items={items.spell}
        onDragStart={onDragStart}
      />
      <MwItemGroup
        name="EnchantedItems"
        mwType="enchantedItem"
        items={items.enchantedItem}
        onDragStart={onDragStart}
      />
      <MwItemGroup
        name="Melee Weapons"
        mwType="meleeWeapon"
        items={items.meleeWeapon}
        onDragStart={onDragStart}
      />
      <MwItemGroup
        name="Missile Weapons"
        mwType="missileWeapon"
        items={items.missileWeapon}
        onDragStart={onDragStart}
      />
      <MwItemGroup
        name="Manses"
        mwType="manse"
        items={items.manse}
        onDragStart={onDragStart}
      />
      <MwItemGroup
        name="Sandestins"
        mwType="sandestin"
        items={items.sandestin}
        onDragStart={onDragStart}
      />
      <MwItemGroup
        name="Retainers"
        mwType="retainer"
        items={items.retainer}
        onDragStart={onDragStart}
      />
    </div>
  );
};
