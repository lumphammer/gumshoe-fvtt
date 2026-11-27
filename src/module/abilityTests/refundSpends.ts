// Giving back the points an ability test took

import { createKeyedQueue } from "../../functions/createKeyedQueue";
import { clampBondPoints } from "../bonds/rules";
import { isBondItem } from "../items/bond";

/**
 * Refunds read the pools they add to, so two at once to the same actor would
 * lose one: they run one at a time per actor.
 */
const runExclusive = createKeyedQueue();

/** Give back the points spent from an ability's pool and its actor's Bonds */
export function refundSpends({
  ability,
  spend,
  bondSpends,
}: {
  ability: Item;
  spend: number;
  bondSpends: readonly { id: string; spend: number }[];
}): Promise<void> {
  const actor = ability.parent;
  return runExclusive(actor?.uuid ?? ability.uuid ?? "", async () => {
    const pool = (ability.system as { pool?: unknown }).pool;
    if (spend > 0 && typeof pool === "number") {
      await ability.update({ system: { pool: pool + spend } });
    }
    if (!actor) return;
    const bondUpdates = bondSpends.flatMap(({ id, spend }) => {
      const bond = actor.items.get(id);
      return isBondItem(bond) && spend > 0
        ? [
            {
              _id: id,
              system: { points: clampBondPoints(bond.system.points + spend) },
            },
          ]
        : [];
    });
    if (bondUpdates.length > 0) {
      await actor.updateEmbeddedDocuments("Item", bondUpdates);
    }
  });
}
