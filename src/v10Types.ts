import { InvestigatorItem } from "./module/InvestigatorItem";
import {
  CardSystemData,
  EquipmentSystemData,
  GeneralAbilitySystemData,
  InvestigativeAbilitySystemData,
  MwItemSystemData,
  PersonalDetailSystemData,
  WeaponSystemData,
} from "./types";

// this is all junk to allow us to start using v10's `.system` property

/**
 * Given a type predicate function and a value, throw an error if the predicate
 * returns false.
 *
 * This just makes it easier to use type predicates in assertions. I tried a hof
 * which just wrapped the predicate, but TS reqires an explicit type signature
 * for type assertions, so it actually ended up fiddlier to use.
 */
function assertPredicate<T>(
  predicate: (item: T | null | undefined) => boolean,
  item: T | null | undefined,
): asserts item is T {
  if (!predicate(item)) {
    throw new Error("type predicate failed");
  }
}

type Optional<T> = T | null | undefined;

// /////////////////////////////////////////////////////////////////////////////
// ITEMS

type InvestigatorItemSystem<
  // Type extends string,
  SystemData,
> = InvestigatorItem & {
  // type: Type;
  system: SystemData;
};

export type GeneralAbilityItem =
  InvestigatorItemSystem<// typeof constants.generalAbility,
  GeneralAbilitySystemData>;

export type InvestigativeAbilityItem =
  InvestigatorItemSystem<// typeof constants.investigativeAbility,
  InvestigativeAbilitySystemData>;

export type WeaponItem = InvestigatorItemSystem<// typeof constants.weapon,
WeaponSystemData>;

export type EquipmentItem =
  InvestigatorItemSystem<// typeof constants.equipment,
  EquipmentSystemData>;

export type MwItem = InvestigatorItemSystem<// typeof constants.mwItem,
MwItemSystemData>;

export type PersonalDetailItem =
  InvestigatorItemSystem<// typeof constants.personalDetail,
  PersonalDetailSystemData>;

export type CardItem = InvestigatorItemSystem<// typeof constants.card,
CardSystemData>;

export type AbilityItem = GeneralAbilityItem | InvestigativeAbilityItem;

export type AnyItem =
  | AbilityItem
  | WeaponItem
  | EquipmentItem
  | MwItem
  | PersonalDetailItem;

export function isGeneralAbilityItem(
  item: Optional<Item>,
): item is GeneralAbilityItem {
  // @ts-expect-error .type
  return item?.type === "generalAbility";
}

export function assertGeneralAbilityItem(
  item: Optional<Item>,
): asserts item is GeneralAbilityItem {
  assertPredicate(isGeneralAbilityItem, item);
}

export function isInvestigativeAbilityItem(
  item: Optional<Item>,
): item is InvestigativeAbilityItem {
  // @ts-expect-error .type
  return item?.type === "investigativeAbility";
}

export function assertInvestigativeAbilityItem(
  item: Optional<Item>,
): asserts item is InvestigativeAbilityItem {
  assertPredicate(isInvestigativeAbilityItem, item);
}

export function isAbilityItem(item: Optional<Item>): item is AbilityItem {
  return isGeneralAbilityItem(item) || isInvestigativeAbilityItem(item);
}

export function assertAbilityItem(
  item: Optional<Item>,
): asserts item is AbilityItem {
  assertPredicate(isAbilityItem, item);
}

export function isEquipmentItem(item: Optional<Item>): item is EquipmentItem {
  // @ts-expect-error .type
  return item?.type === "equipment";
}

export function assertEquipmentItem(
  item: Optional<Item>,
): asserts item is EquipmentItem {
  assertPredicate(isEquipmentItem, item);
}

export function isEquipmentOrAbilityItem(
  item: Optional<Item>,
): item is EquipmentItem | AbilityItem {
  return isAbilityItem(item) || isEquipmentItem(item);
}

export function assertEquipmentOrAbilityItem(
  item: Optional<Item>,
): asserts item is EquipmentItem | AbilityItem {
  assertPredicate(isEquipmentOrAbilityItem, item);
}

export function isWeaponItem(item: Optional<Item>): item is WeaponItem {
  // @ts-expect-error .type
  return item?.type === "weapon";
}

export function assertWeaponItem(
  item: Optional<Item>,
): asserts item is WeaponItem {
  assertPredicate(isWeaponItem, item);
}

export function isMwItem(item: Optional<Item>): item is MwItem {
  // @ts-expect-error .type
  return item?.type === "mwItem";
}

export function assertMwItem(item: Optional<Item>): asserts item is MwItem {
  assertPredicate(isMwItem, item);
}

export function isAnyItem(item: Optional<InvestigatorItem>): item is AnyItem {
  return true;
}

export function assertAnyItem(
  item: Optional<InvestigatorItem>,
): asserts item is AnyItem {
  assertPredicate(isAnyItem, item);
}

export function isPersonalDetailItem(
  item: Optional<Item>,
): item is PersonalDetailItem {
  // @ts-expect-error .type
  return item?.type === "personalDetail";
}

export function assertPersonalDetailItem(
  item: Optional<Item>,
): asserts item is PersonalDetailItem {
  assertPredicate(isPersonalDetailItem, item);
}

export function isCardItem(item: Optional<Item>): item is CardItem {
  // @ts-expect-error .type
  return item?.type === "card";
}

export function assertCardItem(item: Optional<Item>): asserts item is CardItem {
  assertPredicate(isCardItem, item);
}
