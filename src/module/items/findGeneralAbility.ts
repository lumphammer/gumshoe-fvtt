import { generalAbility } from "../../constants";
import type { InvestigatorItem } from "./InvestigatorItem";

/** Find one of an actor's general abilities by name */
export function findGeneralAbility(
  actor: Actor | null,
  name: string,
): InvestigatorItem | undefined {
  return actor?.items.find(
    (item: InvestigatorItem) =>
      item.type === generalAbility && item.name === name,
  );
}
