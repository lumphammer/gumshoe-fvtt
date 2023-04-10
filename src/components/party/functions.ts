import { AbilityDataSource, AbilityType } from "../../types";
import { isAbilityDataSource } from "../../typeAssertions";
import {
  abilityRowkey,
  ActorAbilityInfo,
  categoryHeaderKey,
  RowData,
  typeHeaderKey,
} from "./types";
import * as constants from "../../constants";
import { InvestigatorActor } from "../../module/InvestigatorActor";
import { assertGame } from "../../functions";
import { settings } from "../../settings";

/**
 * get a sorted list of ability tuples
 * this is an intermediate stage - it will need to be built up into row data
 * with information from actors
 */
export const getSystemAbilities = async (): Promise<AbilityDataSource[]> => {
  const proms = settings.newPCPacks.get().map(async (packId) => {
    assertGame(game);
    // getting pack content is slow
    const pack = game.packs.find(
      (p) => p.metadata.type === "Item" && p.collection === packId,
    );
    const content = await pack?.getDocuments();
    const tuples: AbilityDataSource[] = (content || [])
      .filter((x) => isAbilityDataSource(x.data))
      .map((x) => x.data as AbilityDataSource);
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
  a: AbilityDataSource,
  b: AbilityDataSource,
): -1 | 0 | 1 => {
  const typeComparison = compareTypes(a.type, b.type);
  if (typeComparison !== 0) {
    return typeComparison;
  }
  const categoryComparison = compareStrings(a.data.category, b.data.category);
  if (categoryComparison !== 0) {
    return categoryComparison;
  }
  const nameComparison = compareStrings(a.name, b.name);
  return nameComparison;
};

/**
 * given a list of ability tuples and a list of actors, build up the row data
 * we need to render the party sheet
 */
export const buildRowData = (
  abilities: AbilityDataSource[],
  actors: InvestigatorActor[],
): RowData[] => {
  const result: RowData[] = [];

  const sorted = abilities.sort(compareAbilityDataSources);

  let lastType: AbilityType | null = null;
  let lastCategory: string | null = null;

  for (const abilityDataSource of sorted) {
    const {
      type: abilityType,
      name,
      data: { category },
    } = abilityDataSource;
    // const abilityType = ability.type, category, name]
    if (abilityType !== lastType) {
      result.push({ rowType: typeHeaderKey, abilityType });
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
      const ability = actor.getAbilityByName(name, abilityType);
      if (actor.id !== null) {
        const rating = ability?.getRating();
        actorInfo[actor.id] = {
          abilityId: ability?.id ?? undefined,
          actorId: actor.id,
          rating,
        };
        total += rating ?? 0;
      }
    }

    result.push({
      rowType: abilityRowkey,
      abilityDataSource,
      actorInfo,
      total,
    });
  }
  return result;
};
