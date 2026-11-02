import * as constants from "../../constants";
import { assertGame } from "../../functions/isGame";
import type { ActorSnapshot } from "../../module/snapshots/documentStores";
import type { AbilityType } from "../../types";
import type {
  ActorAbilityInfo,
  PartyAbilityView,
  PartyMemberView,
  RowData,
} from "./types";
import { abilityRowKey, categoryHeaderKey, typeHeaderKey } from "./types";

const isAbilityType = (type: unknown): type is AbilityType =>
  type === constants.generalAbility || type === constants.investigativeAbility;

type AbilitySource = {
  readonly type: unknown;
  readonly name?: string | null;
  readonly system: unknown;
};

/** The party sheet's view of an ability, or null for any other item */
export const toAbilityView = (
  item: AbilitySource,
  uuid: string,
): PartyAbilityView | null => {
  if (!isAbilityType(item.type)) return null;
  const system = item.system as { categoryId?: string; rating?: number };
  return {
    uuid,
    type: item.type,
    name: item.name ?? "",
    categoryId: system.categoryId ?? "",
    rating: system.rating ?? 0,
  };
};

/** The party sheet's view of a member, or null if it isn't a PC */
export const toMemberView = (
  actor: ActorSnapshot | null,
): PartyMemberView | null => {
  if (actor === null || actor._id === null || actor.type !== constants.pc) {
    return null;
  }
  const actorId = actor._id;
  return {
    id: actorId,
    name: actor.name,
    img: actor.img ?? null,
    abilities: actor.items.flatMap((item) => {
      const view = toAbilityView(item, `Actor.${actorId}.Item.${item._id}`);
      return view ? [view] : [];
    }),
  };
};

/**
 * The abilities in the given packs (the ones for new PCs), sorted later.
 * Getting a pack's content is slow, hence a promise.
 */
export const getSystemAbilities = async (
  packIds: readonly string[],
): Promise<PartyAbilityView[]> => {
  assertGame(game);
  const results = await Promise.all(
    packIds.map(async (packId) => {
      const pack = game.packs.find(
        (p) => p.metadata.type === "Item" && p.collection === packId,
      );
      const content = (await pack?.getDocuments()) ?? [];
      return content.flatMap((item) => {
        const view = toAbilityView(item as AbilitySource, item.uuid);
        return view ? [view] : [];
      });
    }),
  );
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
  a: PartyAbilityView,
  b: PartyAbilityView,
): -1 | 0 | 1 => {
  const typeComparison = compareTypes(a.type, b.type);
  if (typeComparison !== 0) {
    return typeComparison;
  }
  const categoryComparison = compareStrings(a.categoryId, b.categoryId);
  if (categoryComparison !== 0) {
    return categoryComparison;
  }
  const nameComparison = compareStrings(a.name, b.name);
  return nameComparison;
};

/**
 * abilities are matched to actors by exact type + name (see
 * PCModel.getAbilityByName), so that pair is what identifies a row
 */
const abilityKey = (ability: { type: AbilityType; name: string }) =>
  `${ability.type}///${ability.name}`;

/**
 * find abilities that the party's actors own but which aren't in any of the
 * configured PC packs, so they can still get a row on the sheet.
 *
 * de-duplicated by type + name across the whole party. The first actor who has
 * one supplies the representative item for the row.
 */
const getExtraAbilities = (
  packAbilities: readonly PartyAbilityView[],
  actors: readonly PartyMemberView[],
): PartyAbilityView[] => {
  const seen = new Set(packAbilities.map(abilityKey));
  const extras: PartyAbilityView[] = [];
  for (const actor of actors) {
    for (const item of actor.abilities) {
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
const sumRatingsByType = (
  actor: PartyMemberView,
  abilityType: AbilityType,
): number => {
  let total = 0;
  for (const ability of actor.abilities) {
    if (ability.type === abilityType) {
      total += ability.rating;
    }
  }
  return total;
};

/**
 * build the per-actor and party-wide build point totals for one ability type
 */
const buildTypeTotals = (
  actors: readonly PartyMemberView[],
  abilityType: AbilityType,
) => {
  const actorTotals: { [actorId: string]: number } = {};
  let grandTotal = 0;
  for (const actor of actors) {
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
  abilities: readonly PartyAbilityView[],
  actors: readonly PartyMemberView[],
): RowData[] => {
  const result: RowData[] = [];

  const extras = getExtraAbilities(abilities, actors);
  const extraKeys = new Set(extras.map(abilityKey));
  // don't sort `abilities` in place - it's held in state by the sheet
  const sorted = [...abilities, ...extras].sort(compareAbilityDataSources);

  let lastType: AbilityType | null = null;
  let lastCategory: string | null = null;

  for (const ability of sorted) {
    const { type: abilityType, name, categoryId: category } = ability;
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
      // matched by exact type + name, as PCModel.getAbilityByName does
      const own = actor.abilities.find(
        (a) => a.type === abilityType && a.name === name,
      );
      actorInfo[actor.id] = {
        abilityUuid: own?.uuid,
        actorId: actor.id,
        rating: own?.rating,
      };
      total += own?.rating ?? 0;
    }

    result.push({
      rowType: abilityRowKey,
      ability,
      isExtra: extraKeys.has(abilityKey(ability)),
      actorInfo,
      total,
    });
  }
  return result;
};
