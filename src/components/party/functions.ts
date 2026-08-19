import * as constants from "../../constants";
import { assertGame } from "../../functions/isGame";
import { PCActor } from "../../module/actors/pc";
import { AbilityItem, isAbilityItem } from "../../module/items/exports";
import { InvestigatorItem } from "../../module/items/InvestigatorItem";
import { settings } from "../../settings/settings";
import { AbilityType } from "../../types";
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
    const content = ((await pack?.getDocuments()) ?? []) as InvestigatorItem[];
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
 * abilities are matched to actors by exact type + name (see
 * PCModel.getAbilityByName), so that pair is what identifies a row
 */
const abilityKey = (item: AbilityItem) => `${item.type}///${item.name ?? ""}`;

/**
 * find abilities that the party's actors own but which aren't in any of the
 * configured PC packs, so they can still get a row on the sheet.
 *
 * de-duplicated by type + name across the whole party. The first actor who has
 * one supplies the representative item for the row.
 */
const getExtraAbilities = (
  packAbilities: AbilityItem[],
  actors: PCActor[],
): AbilityItem[] => {
  const seen = new Set(packAbilities.map(abilityKey));
  const extras: AbilityItem[] = [];
  for (const actor of actors) {
    for (const item of actor.items.values()) {
      if (!isAbilityItem(item)) {
        continue;
      }
      const key = abilityKey(item);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      extras.push(item);
    }
  }
  return extras;
};

/**
 * sum the ratings of every ability of the given type that the actor owns.
 */
const sumRatingsByType = (actor: PCActor, abilityType: AbilityType): number => {
  let total = 0;
  for (const item of actor.items.values()) {
    if (isAbilityItem(item) && item.type === abilityType) {
      total += item.system.rating;
    }
  }
  return total;
};

/**
 * build the per-actor and party-wide build point totals for one ability type
 */
const buildTypeTotals = (actors: PCActor[], abilityType: AbilityType) => {
  const actorTotals: { [actorId: string]: number } = {};
  let grandTotal = 0;
  for (const actor of actors) {
    if (actor?.id == null) {
      continue;
    }
    const total = sumRatingsByType(actor, abilityType);
    actorTotals[actor.id] = total;
    grandTotal += total;
  }
  return { actorTotals, grandTotal };
};

/**
 * given a list of ability tuples and a list of actors, build up the row data
 * we need to render the party sheet
 */
export const buildRowData = (
  abilities: AbilityItem[],
  actors: PCActor[],
): RowData[] => {
  const result: RowData[] = [];

  const extras = getExtraAbilities(abilities, actors);
  const extraKeys = new Set(extras.map(abilityKey));
  // don't sort `abilities` in place - it's held in state by the sheet
  const sorted = [...abilities, ...extras].sort(compareAbilityDataSources);

  let lastType: AbilityType | null = null;
  let lastCategory: string | null = null;

  for (const abilityItem of sorted) {
    const {
      type: abilityType,
      name,
      system: { categoryId: category },
    } = abilityItem;
    // const abilityType = ability.type, category, name]
    if (abilityType !== lastType) {
      result.push({
        rowType: typeHeaderKey,
        abilityType,
        ...buildTypeTotals(actors, abilityType),
      });
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
      const ability = actor.system.getAbilityByName(name ?? "", abilityType);
      if (actor.id !== null) {
        const rating = ability?.system.rating;
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
      isExtra: extraKeys.has(abilityKey(abilityItem)),
      actorInfo,
      total,
    });
  }
  return result;
};
