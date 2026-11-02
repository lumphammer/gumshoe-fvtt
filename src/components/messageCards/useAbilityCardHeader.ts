import { assertApplicationV2 } from "../../functions/assertApplicationV2";
import { useMaybeItemSelector } from "../../hooks/useItemSnapshot";
import type { AbilityItem } from "../../module/items/exports";
import type { InvestigatorItem } from "../../module/items/InvestigatorItem";

/**
 * The name and picture of the ability a card was rolled with, as they are now
 * (null if it's gone), and a way to open its sheet.
 */
export function useAbilityCardHeader(
  ability: InvestigatorItem | AbilityItem | undefined,
) {
  const header = useMaybeItemSelector(ability, (snapshot) =>
    snapshot ? { name: snapshot.name, img: snapshot.img ?? null } : null,
  );
  const openSheet = () => {
    const sheet = ability?.sheet;
    if (!sheet) return;
    assertApplicationV2(sheet);
    void sheet.render({ force: true });
  };
  return { header, openSheet };
}
