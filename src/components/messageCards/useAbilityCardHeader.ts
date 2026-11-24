import { openSheet } from "../../functions/openSheet";
import { useMaybeItemSelector } from "../../hooks/useItemSnapshot";
import type { AbilityItem } from "../../module/items/exports";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";

/**
 * The name and picture of the ability a card was rolled with, as they are now
 * (null if it's gone), and a way to open its sheet (undefined if it's gone,
 * so the card shows its saved name as text rather than a dead button).
 */
export function useAbilityCardHeader(
  ability: InvestigatorItem | AbilityItem | undefined,
) {
  const header = useMaybeItemSelector(ability, (snapshot) =>
    snapshot ? { name: snapshot.name, img: snapshot.img ?? null } : null,
  );
  const openAbilitySheet =
    ability && header
      ? () => {
          openSheet(ability);
        }
      : undefined;
  return { header, openSheet: openAbilitySheet };
}
