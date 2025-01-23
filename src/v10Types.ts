import { InvestigatorActor } from "./module/InvestigatorActor";
import { InvestigatorItem } from "./module/InvestigatorItem";
import {
  CardSystemData,
  EquipmentSystemData,
  GeneralAbilitySystemData,
  InvestigativeAbilitySystemData,
  MwItemSystemData,
  NPCSystemData,
  PartySystemData,
  PCSystemData,
  PersonalDetailSystemData,
  RecursivePartial,
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
  item: Optional<InvestigatorItem>,
): item is GeneralAbilityItem {
  // @ts-expect-error .type
  return item?.type === "generalAbility";
}

export function assertGeneralAbilityItem(
  item: Optional<InvestigatorItem>,
): asserts item is GeneralAbilityItem {
  assertPredicate(isGeneralAbilityItem, item);
}

export function isInvestigativeAbilityItem(
  item: Optional<InvestigatorItem>,
): item is InvestigativeAbilityItem {
  // @ts-expect-error .type
  return item?.type === "investigativeAbility";
}

export function assertInvestigativeAbilityItem(
  item: Optional<InvestigatorItem>,
): asserts item is InvestigativeAbilityItem {
  assertPredicate(isInvestigativeAbilityItem, item);
}

export function isAbilityItem(
  item: Optional<InvestigatorItem>,
): item is AbilityItem {
  return isGeneralAbilityItem(item) || isInvestigativeAbilityItem(item);
}

export function assertAbilityItem(
  item: Optional<InvestigatorItem>,
): asserts item is AbilityItem {
  assertPredicate(isAbilityItem, item);
}

export function isEquipmentItem(
  item: Optional<InvestigatorItem>,
): item is EquipmentItem {
  // @ts-expect-error .type
  return item?.type === "equipment";
}

export function assertEquipmentItem(
  item: Optional<InvestigatorItem>,
): asserts item is EquipmentItem {
  assertPredicate(isEquipmentItem, item);
}

export function isEquipmentOrAbilityItem(
  item: Optional<InvestigatorItem>,
): item is EquipmentItem | AbilityItem {
  return isAbilityItem(item) || isEquipmentItem(item);
}

export function assertEquipmentOrAbilityItem(
  item: Optional<InvestigatorItem>,
): asserts item is EquipmentItem | AbilityItem {
  assertPredicate(isEquipmentOrAbilityItem, item);
}

export function isWeaponItem(
  item: Optional<InvestigatorItem>,
): item is WeaponItem {
  // @ts-expect-error .type
  return item?.type === "weapon";
}

export function assertWeaponItem(
  item: Optional<InvestigatorItem>,
): asserts item is WeaponItem {
  assertPredicate(isWeaponItem, item);
}

export function isMwItem(item: Optional<InvestigatorItem>): item is MwItem {
  // @ts-expect-error .type
  return item?.type === "mwItem";
}

export function assertMwItem(
  item: Optional<InvestigatorItem>,
): asserts item is MwItem {
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
  item: Optional<InvestigatorItem>,
): item is PersonalDetailItem {
  // @ts-expect-error .type
  return item?.type === "personalDetail";
}

export function assertPersonalDetailItem(
  item: Optional<InvestigatorItem>,
): asserts item is PersonalDetailItem {
  assertPredicate(isPersonalDetailItem, item);
}

export function isCardItem(item: Optional<InvestigatorItem>): item is CardItem {
  // @ts-expect-error .type
  return item?.type === "card";
}

export function assertCardItem(
  item: Optional<InvestigatorItem>,
): asserts item is CardItem {
  assertPredicate(isCardItem, item);
}

// /////////////////////////////////////////////////////////////////////////////
// ACTORS

type InvestigatorActorSystem<SystemData> = InvestigatorActor & {
  system: SystemData;
};

export type PCActor = InvestigatorActorSystem<PCSystemData>;

export type NPCActor = InvestigatorActorSystem<NPCSystemData>;

export type PartyActor = InvestigatorActorSystem<PartySystemData>;

export type ActiveCharacterActor = PCActor | NPCActor;

export type AnyActor = PCActor | NPCActor | PartyActor;

export type ActorPayload = RecursivePartial<AnyActor>;

export function isPCActor(actor: Actor | null): actor is PCActor {
  // @ts-expect-error .type
  return actor?.type === "pc";
}

export function assertPCActor(actor: Actor | null): asserts actor is PCActor {
  if (!isPCActor(actor)) {
    throw new Error("not a PC actor");
  }
}

export function isNPCActor(actor: Actor | null): actor is NPCActor {
  // @ts-expect-error .type
  return actor?.type === "npc";
}

export function assertNPCActor(actor: Actor | null): asserts actor is NPCActor {
  if (!isNPCActor(actor)) {
    throw new Error("not an NPC actor");
  }
}

export function isPartyActor(actor: Actor | null): actor is PartyActor {
  // @ts-expect-error .type
  return actor?.type === "party";
}

export function assertPartyActor(
  actor: Actor | null,
): asserts actor is PartyActor {
  if (!isPartyActor(actor)) {
    throw new Error("not a party actor");
  }
}

export function isActiveCharacterActor(
  actor: Actor | null,
): actor is ActiveCharacterActor {
  return isPCActor(actor) || isNPCActor(actor);
}

export function assertActiveCharacterActor(
  actor: Actor | null,
): asserts actor is ActiveCharacterActor {
  if (!isActiveCharacterActor(actor)) {
    throw new Error("not a PC or NPC actor");
  }
}

export function isAnyActor(actor: Actor | null): actor is AnyActor {
  return true;
}

export function assertAnyActor(actor: Actor | null): asserts actor is AnyActor {
  if (!isAnyActor(actor)) {
    throw new Error("not an actor");
  }
}
