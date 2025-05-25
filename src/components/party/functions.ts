import * as constants from "../../constants";
import { assertGame } from "../../functions/utilities";
import { InvestigatorActor } from "../../module/actors/InvestigatorActor";
import { settings } from "../../settings/settings";
import { AbilityType } from "../../types";
import { AbilityItem, AnyItem, isAbilityItem } from "../../v10Types";
import {
  abilityRowKey,
  ActorAbilityInfo,
  categoryHeaderKey,
  RowData,
  typeHeaderKey,
} from "./types";

/**
 * get a sorted list of ability tuples
 * this is an intermediate stage - it will need to be built up into row data
 * with information from actors
 */
export const getSystemAbilities = async (): Promise<AbilityItem[]> => {
  const proms = settings.newPCPacks.get().map(async (packId) => {
    assertGame(game);
    // getting pack content is slow
    const pack = game.packs.find(
      (p) => p.metadata.type === "Item" && p.collection === packId,
    );
    const content = ((await pack?.getDocuments()) ?? []) as AnyItem[];
    const tuples: AbilityItem[] = content.filter((item) => isAbilityItem(item));
    return tuples;
  });
  const results = await Promise.all(proms);
  return results.flat();
};

/**
 * ordering fn for ability types - inv first, then gen
 */
const compareTypes = (a: AbilityType, b: AbilityType) =>
  a === constants.investigativeAbility && b === constants.generalAbility
    ? -1
    : a === constants.generalAbility && b === constants.investigativeAbility
      ? +1
      : 0;

/**
 * case-insensitive string ordering fn
 */
const compareStrings = (a = "", b = ""): -1 | 0 | 1 => {
  const a_ = a.toLowerCase();
  const b_ = b.toLowerCase();
  return a_ < b_ ? -1 : a_ > b_ ? +1 : 0;
};

/**
 * ordering function for ability tuples
 */
const compareAbilityDataSources = (
  a: AbilityItem,
  b: AbilityItem,
): -1 | 0 | 1 => {
  // @ts-expect-error .type
  const typeComparison = compareTypes(a.type, b.type);
  if (typeComparison !== 0) {
    return typeComparison;
  }
  const categoryComparison = compareStrings(
    a.system.categoryId,
    b.system.categoryId,
  );
  if (categoryComparison !== 0) {
    return categoryComparison;
  }
  const nameComparison = compareStrings(a.name ?? "", b.name ?? "");
  return nameComparison;
};

/**
 * given a list of ability tuples and a list of actors, build up the row data
 * we need to render the party sheet
 */
export const buildRowData = (
  abilities: AbilityItem[],
  actors: InvestigatorActor[],
): RowData[] => {
  const result: RowData[] = [];

  const sorted = abilities.sort(compareAbilityDataSources);

  let lastType: AbilityType | null = null;
  let lastCategory: string | null = null;

  for (const abilityItem of sorted) {
    const {
      type: abilityType,
      name,
      system: { categoryId: category },
    } = abilityItem;
    // const abilityType = ability.type, category, name]
    // @ts-expect-error .type
    if (abilityType !== lastType) {
      // @ts-expect-error .type
      result.push({ rowType: typeHeaderKey, abilityType });
      // @ts-expect-error .type
      lastType = abilityType;
      lastCategory = null;
    }
    if (category !== lastCategory) {
      result.push({ rowType: categoryHeaderKey, category });
      lastCategory = category;
    }
    const actorInfo: { [actorId: string]: ActorAbilityInfo } = {};
    let total = 0;

    for (const actor of actors) {
      if (actor === undefined) {
        continue;
      }
      // @ts-expect-error .type
      const ability = actor.getAbilityByName(name ?? "", abilityType);
      if (actor.id !== null) {
        const rating = ability?.system.rating ?? 0;
        actorInfo[actor.id] = {
          abilityId: ability?.id ?? undefined,
          actorId: actor.id,
          rating,
        };
        total += rating ?? 0;
      }
    }

    result.push({
      rowType: abilityRowKey,
      abilityItem,
      actorInfo,
      total,
    });
  }
  return result;
};
